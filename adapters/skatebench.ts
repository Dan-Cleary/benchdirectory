import type { Adapter, Snapshot } from "./types";
import { fetchJson, pct } from "./lib";

// SkateBench by Theo (t3.gg). Ranks models on how well they name skateboarding
// tricks from technical definitions. Results JSON is committed to the repo by
// Theo's own runs.

const DATA_URL =
  "https://raw.githubusercontent.com/T3-Content/skatebench/main/visualizer/data/benchmark-results.json";

interface Ranking {
  model: string;
  correct: number;
  totalTests: number;
  successRate: number;
  averageDuration: number;
  totalCost: number;
}

interface Results {
  metadata: { timestamp: string; testSuite: string; version: string };
  rankings: Ranking[];
}

export const skatebench: Adapter = {
  slug: "skatebench",
  async fetchSnapshot(): Promise<Snapshot> {
    const raw = await fetchJson<Results>(DATA_URL);
    const sorted = [...raw.rankings].sort((a, b) => b.successRate - a.successRate);
    return {
      benchmark: {
        slug: "skatebench",
        name: "SkateBench",
        tagline: "Can the model name the skateboard trick from its technical definition?",
        owner: { name: "Theo", xHandle: "theo", url: "https://t3.gg" },
        siteUrl: "https://skatebench.t3.gg",
        repoUrl: "https://github.com/T3-Content/skatebench",
        license: "MIT",
        scoreLabel: "Success rate",
        direction: "higher-better",
        scoreExplainer:
          "Share of trick-terminology questions answered correctly. Higher means the model knows its skateboarding.",
      },
      retrievedAt: new Date().toISOString(),
      sourceGeneratedAt: raw.metadata.timestamp,
      sourceDataUrl: DATA_URL,
      entries: sorted.map((r, i) => ({
        rank: i + 1,
        model: r.model,
        score: r.successRate,
        display: pct(r.successRate),
        extras: [
          { label: "Correct", value: `${r.correct}/${r.totalTests}` },
          { label: "Run cost", value: `$${r.totalCost.toFixed(2)}` },
        ],
      })),
    };
  },
};
