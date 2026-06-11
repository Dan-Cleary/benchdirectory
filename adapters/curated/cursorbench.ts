import type { Adapter, Snapshot } from "../types";

// CursorBench by Cursor. Ambiguous, multi-file tasks taken from real Cursor
// engineering sessions; explicitly closed-source ("our internal eval suite"),
// but the leaderboard itself is published at cursor.com/cursorbench. This
// snapshot is hand-curated from that page (CursorBench 3.1). Update when
// Cursor refreshes the leaderboard.

const SOURCE_PAGE = "https://cursor.com/cursorbench";

const SCORES: { model: string; variant?: string; score: number }[] = [
  { model: "Fable 5", variant: "Max", score: 72.9 },
  { model: "Fable 5", variant: "Extra High", score: 72.0 },
  { model: "Fable 5", variant: "High", score: 70.6 },
  { model: "Fable 5", variant: "Medium", score: 69.8 },
  { model: "Opus 4.7", variant: "Max", score: 64.8 },
  { model: "GPT-5.5", variant: "Extra High", score: 64.3 },
  { model: "Fable 5", variant: "Low", score: 64.2 },
  { model: "Opus 4.8", variant: "Max", score: 63.8 },
  { model: "Composer 2.5", score: 63.2 },
  { model: "GPT-5.5", variant: "High", score: 62.6 },
  { model: "Opus 4.8", variant: "Extra High", score: 62.1 },
  { model: "Opus 4.7", variant: "Extra High", score: 61.6 },
  { model: "Opus 4.7", variant: "High", score: 59.4 },
  { model: "GPT-5.5", variant: "Medium", score: 59.2 },
  { model: "Opus 4.8", variant: "High", score: 58.4 },
  { model: "Opus 4.8", variant: "Medium", score: 56.6 },
  { model: "Opus 4.8", variant: "Low", score: 54.3 },
  { model: "Opus 4.7", variant: "Medium", score: 52.7 },
  { model: "Composer 2", score: 52.2 },
  { model: "Gemini 3.5 Flash", score: 49.8 },
  { model: "Sonnet 4.6", variant: "Max", score: 49.0 },
  { model: "GPT-5.5", variant: "Low", score: 48.8 },
  { model: "Sonnet 4.6", variant: "High", score: 48.8 },
  { model: "Opus 4.7", variant: "Low", score: 48.3 },
  { model: "Kimi 2.6", score: 47.6 },
  { model: "Sonnet 4.6", variant: "Medium", score: 46.0 },
  { model: "Sonnet 4.6", variant: "Low", score: 41.5 },
  { model: "Kimi 2.5", score: 31.9 },
];

export const cursorbench: Adapter = {
  slug: "cursorbench",
  async fetchSnapshot(): Promise<Snapshot> {
    return {
      benchmark: {
        slug: "cursorbench",
        name: "CursorBench",
        tagline: "Ambiguous, multi-file tasks from real Cursor engineering sessions.",
        owner: { name: "Cursor", xHandle: "cursor_ai", url: "https://cursor.com" },
        siteUrl: SOURCE_PAGE,
        repoUrl: "https://cursor.com/blog/cursorbench",
        scoreLabel: "Score",
        direction: "higher-better",
        scoreExplainer:
          "CursorBench 3.1: correctness, code quality, efficiency, and interaction behavior on tasks sourced from real Cursor sessions.",
        curatedNote:
          "The benchmark is closed-source; only the leaderboard is public. This table is hand-curated from cursor.com/cursorbench.",
      },
      retrievedAt: new Date().toISOString(),
      sourceDataUrl: SOURCE_PAGE,
      entries: SCORES.map((s, i) => ({
        rank: i + 1,
        model: s.model,
        variant: s.variant,
        score: s.score,
        display: `${s.score.toFixed(1)}%`,
      })),
    };
  },
};
