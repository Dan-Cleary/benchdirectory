import type { Adapter, Snapshot } from "./types";
import { pct } from "./lib";

// SlopBench by Dan Cleary. Measures how much classic AI slop (em-dash abuse,
// stock phrases, bullet spam) a model produces across a fixed prompt set.
// Reads the public leaderboard query from the production Convex deployment —
// the same data slop-bench.vercel.app renders.

const CONVEX_URL = "https://uncommon-sandpiper-321.convex.cloud/api/query";

interface Run {
  model: string;
  pure_slop_rate: number;
  bullet_rate?: number;
  em_dash_rate?: number;
  total_cost_usd?: number;
  run_date: number;
}

export const slopbench: Adapter = {
  slug: "slopbench",
  async fetchSnapshot(): Promise<Snapshot> {
    const res = await fetch(CONVEX_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "runs:getLeaderboard",
        args: {},
        format: "json",
      }),
    });
    if (!res.ok) throw new Error(`POST ${CONVEX_URL} -> ${res.status}`);
    const body = (await res.json()) as { status: string; value: Run[] };
    if (body.status !== "success") {
      throw new Error(`Convex query failed: ${JSON.stringify(body)}`);
    }
    // getLeaderboard already returns latest run per model, sorted by slop rate asc
    return {
      benchmark: {
        slug: "slopbench",
        name: "SlopBench",
        tagline:
          "How much classic AI slop does a model write when nobody tells it not to?",
        owner: {
          name: "Dan Cleary",
          xHandle: "DanJCleary",
          url: "https://x.com/DanJCleary",
        },
        siteUrl: "https://slop-bench.vercel.app",
        repoUrl: "https://github.com/Dan-Cleary/slopbench",
        scoreLabel: "Slop rate",
        direction: "lower-better",
        scoreExplainer:
          "Percentage of outputs containing classic AI slop phrases and patterns. Lower is better.",
      },
      retrievedAt: new Date().toISOString(),
      sourceDataUrl: `${CONVEX_URL} (runs:getLeaderboard)`,
      entries: body.value.map((r, i) => ({
        rank: i + 1,
        model: r.model.includes("/") ? r.model.split("/")[1] : r.model,
        org: r.model.includes("/") ? r.model.split("/")[0] : undefined,
        score: r.pure_slop_rate,
        display: pct(r.pure_slop_rate),
        extras: [
          ...(r.bullet_rate !== undefined
            ? [{ label: "Bullet rate", value: pct(r.bullet_rate * 100, 0) }]
            : []),
          ...(r.total_cost_usd !== undefined
            ? [{ label: "Run cost", value: `$${r.total_cost_usd.toFixed(2)}` }]
            : []),
        ],
      })),
    };
  },
};
