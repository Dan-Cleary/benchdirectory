import type { Adapter, Snapshot } from "./types";
import { fetchText, parseCsv, pct } from "./lib";

// BullshitBench by Peter Gostev. Throws professionally-worded nonsense
// questions at models and scores whether they push back (green), hedge
// (amber), or confidently answer the unanswerable (red). Scored rows are
// exported by Peter's pipeline to data/latest/leaderboard.csv.

const DATA_URL =
  "https://raw.githubusercontent.com/petergpt/bullshit-benchmark/main/data/latest/leaderboard.csv";

export const bullshitbench: Adapter = {
  slug: "bullshitbench",
  async fetchSnapshot(): Promise<Snapshot> {
    const rows = parseCsv(await fetchText(DATA_URL));
    return {
      benchmark: {
        slug: "bullshitbench",
        name: "BullshitBench",
        tagline:
          "Does the model call out a nonsense question, or go full expert mode on it?",
        owner: {
          name: "Peter Gostev",
          xHandle: "petergostev",
          url: "https://github.com/petergpt",
        },
        siteUrl: "https://petergpt.github.io/bullshit-benchmark/",
        repoUrl: "https://github.com/petergpt/bullshit-benchmark",
        scoreLabel: "Avg score (0–2)",
        direction: "higher-better",
        scoreExplainer:
          "Average over trap questions: 2 = clear pushback, 1 = hedges but plays along, 0 = accepts the nonsense. Higher means less bullshitting.",
      },
      retrievedAt: new Date().toISOString(),
      sourceDataUrl: DATA_URL,
      entries: rows.map((r) => {
        // model field looks like "anthropic/claude-opus-4.8@reasoning=none"
        const [modelId, variantRaw] = r.model.split("@");
        const model = modelId.includes("/") ? modelId.split("/")[1] : modelId;
        return {
          rank: Number(r.rank),
          model,
          org: r.org || undefined,
          variant: variantRaw,
          score: Number(r.avg_score),
          display: Number(r.avg_score).toFixed(2),
          extras: [
            { label: "Green", value: pct(Number(r.green_rate) * 100, 0) },
            { label: "Red", value: pct(Number(r.red_rate) * 100, 0) },
            { label: "Questions", value: r.nonsense_count },
          ],
        };
      }),
    };
  },
};
