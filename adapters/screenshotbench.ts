import type { Adapter, Snapshot } from "./types";

// ScreenshotBench by Dan Cleary. Models implement a React UI from a single
// reference screenshot; an LLM judge scores visual fidelity 0-100. Reads the
// public matrix query from the production Convex deployment behind
// screenshotbench.com and averages each model's judged cells.

const CONVEX_URL = "https://efficient-anteater-70.convex.cloud/api/query";

interface MatrixRun {
  modelId: string;
  status: string;
  judge?: { score: number };
}

interface Model {
  _id: string;
  displayName: string;
  provider: string;
}

async function convexQuery<T>(path: string): Promise<T> {
  const res = await fetch(CONVEX_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args: {}, format: "json" }),
  });
  if (!res.ok) throw new Error(`POST ${CONVEX_URL} ${path} -> ${res.status}`);
  const body = (await res.json()) as { status: string; value: T };
  if (body.status !== "success") {
    throw new Error(`Convex query ${path} failed: ${JSON.stringify(body)}`);
  }
  return body.value;
}

export const screenshotbench: Adapter = {
  slug: "screenshotbench",
  async fetchSnapshot(): Promise<Snapshot> {
    const [{ runs }, models] = await Promise.all([
      convexQuery<{ runs: MatrixRun[] }>("runs:matrix"),
      convexQuery<Model[]>("models:list"),
    ]);
    const byId = new Map(models.map((m) => [m._id, m]));

    const perModel = new Map<string, { scores: number[]; model: Model }>();
    for (const run of runs) {
      if (run.status !== "complete" || run.judge === undefined) continue;
      const model = byId.get(run.modelId);
      if (!model) continue;
      const bucket = perModel.get(run.modelId) ?? { scores: [], model };
      bucket.scores.push(run.judge.score);
      perModel.set(run.modelId, bucket);
    }

    const aggregated = Array.from(perModel.values())
      .map(({ scores, model }) => ({
        model,
        avg: scores.reduce((a, b) => a + b, 0) / scores.length,
        cells: scores.length,
      }))
      .sort((a, b) => b.avg - a.avg);

    return {
      benchmark: {
        slug: "screenshotbench",
        name: "ScreenshotBench",
        tagline: "Hand the model one screenshot — how faithfully does it rebuild the UI in React?",
        owner: {
          name: "Dan Cleary",
          xHandle: "DanJCleary",
          url: "https://x.com/DanJCleary",
        },
        siteUrl: "https://screenshotbench.com",
        repoUrl: "https://github.com/Dan-Cleary/screenshotbench",
        scoreLabel: "Avg judge score",
        direction: "higher-better",
        scoreExplainer:
          "LLM judge scores visual fidelity 0-100 (layout, palette, polish, completeness) per reference screenshot, averaged across references.",
      },
      retrievedAt: new Date().toISOString(),
      sourceDataUrl: `${CONVEX_URL} (runs:matrix, models:list)`,
      entries: aggregated.map((a, i) => ({
        rank: i + 1,
        model: a.model.displayName,
        org: a.model.provider,
        score: a.avg,
        display: a.avg.toFixed(1),
        extras: [{ label: "Cells", value: String(a.cells) }],
      })),
    };
  },
};
