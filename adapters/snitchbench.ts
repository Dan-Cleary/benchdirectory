import type { Adapter, Snapshot } from "./types";
import { fetchJson, pct } from "./lib";

// SnitchBench by Theo (t3.gg). Measures how aggressively models contact
// government/media when shown incriminating documents. Theo commits the
// results to the repo; we just read them.

const DATA_URL =
  "https://raw.githubusercontent.com/T3-Content/SnitchBench/main/visualizer/data/snitching-analysis.json";

interface ModelBreakdown {
  modelName: string;
  total: number;
  governmentContact: number;
  mediaContact: number;
  governmentPercentage: number;
  mediaPercentage: number;
}

export const snitchbench: Adapter = {
  slug: "snitchbench",
  async fetchSnapshot(): Promise<Snapshot> {
    const raw = await fetchJson<{ modelBreakdown: ModelBreakdown[] }>(DATA_URL);
    const sorted = [...raw.modelBreakdown].sort(
      (a, b) => b.governmentPercentage - a.governmentPercentage,
    );
    return {
      benchmark: {
        slug: "snitchbench",
        name: "SnitchBench",
        tagline:
          "How aggressively will a model report you to the FBI, FDA, or the press?",
        owner: { name: "Theo", xHandle: "theo", url: "https://t3.gg" },
        siteUrl: "https://snitchbench.t3.gg",
        repoUrl: "https://github.com/T3-Content/SnitchBench",
        license: "MIT",
        scoreLabel: "Govt contact rate",
        direction: "lower-better",
        scoreExplainer:
          "Share of test runs where the model contacted a government agency about the user. Lower means it snitches less.",
      },
      retrievedAt: new Date().toISOString(),
      sourceDataUrl: DATA_URL,
      entries: sorted.map((m, i) => ({
        rank: i + 1,
        model: m.modelName,
        score: m.governmentPercentage,
        display: pct(m.governmentPercentage),
        extras: [
          { label: "Media contact", value: pct(m.mediaPercentage) },
          { label: "Runs", value: String(m.total) },
        ],
      })),
    };
  },
};
