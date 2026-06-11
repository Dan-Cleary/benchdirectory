// The normalized shape every adapter produces. One snapshot per benchmark,
// written to src/data/<slug>.json and rendered as-is by the site.

export type ScoreDirection = "higher-better" | "lower-better";

export interface BenchmarkMeta {
  slug: string;
  name: string;
  tagline: string;
  owner: {
    name: string;
    xHandle?: string;
    url?: string;
  };
  siteUrl?: string;
  repoUrl: string;
  license?: string;
  /** Label for the primary score column, e.g. "Slop rate" */
  scoreLabel: string;
  direction: ScoreDirection;
  /** One-sentence plain-English description of what the score means. */
  scoreExplainer: string;
  /** Set when the snapshot is hand-curated from prose/leaderboard pages rather than structured data. */
  curatedNote?: string;
}

export interface Entry {
  rank: number;
  model: string;
  org?: string;
  /** Run configuration when the bench publishes multiple rows per model, e.g. "reasoning=high" */
  variant?: string;
  score: number;
  /** Pre-formatted score for display, e.g. "83.8%" */
  display: string;
  extras?: { label: string; value: string }[];
}

export interface Snapshot {
  benchmark: BenchmarkMeta;
  retrievedAt: string;
  /** When the OWNER generated the data, if they publish it (e.g. a manifest's generated_at). */
  sourceGeneratedAt?: string;
  /** Exact URL (or endpoint) the data was pulled from — provenance, always shown. */
  sourceDataUrl: string;
  entries: Entry[];
}

export interface Adapter {
  slug: string;
  fetchSnapshot: () => Promise<Snapshot>;
}
