import type { Adapter, Snapshot } from "../types";

// Senior Engineer bench by Every (Dan Shipper's AI-native media/software
// company). A coding agent gets a vibe-coded production codebase that went
// sideways and is told to rewrite it from first principles; graded 0-100.
// Every publishes scores editorially in their "Vibe Check" articles, not as
// structured data — so this snapshot is hand-curated from their published
// numbers, with the article as provenance. Update when a new Vibe Check drops.

const SOURCE_ARTICLE = "https://every.to/anthropic-mythos-our-fable-vibe-check";

const SCORES: { model: string; score: number; source: string }[] = [
  // "Fable 5 scored 91/100 on Every's Senior Engineer benchmark, compared to
  //  Opus 4.8's 63 and GPT-5.5's 62." — Vibe Check, 2026-06-09
  { model: "Claude Fable 5", score: 91, source: SOURCE_ARTICLE },
  { model: "Claude Opus 4.8", score: 63, source: SOURCE_ARTICLE },
  { model: "GPT-5.5", score: 62, source: SOURCE_ARTICLE },
];

export const everySeniorEngineer: Adapter = {
  slug: "every-senior-engineer",
  async fetchSnapshot(): Promise<Snapshot> {
    const entries = [...SCORES].sort((a, b) => b.score - a.score);
    return {
      benchmark: {
        slug: "every-senior-engineer",
        name: "Senior Engineer Bench",
        tagline: "Can the agent rewrite a vibe-coded production codebase from first principles?",
        owner: {
          name: "Every (Dan Shipper)",
          xHandle: "danshipper",
          url: "https://every.to",
        },
        siteUrl: "https://every.to/vibe-check",
        repoUrl: "https://github.com/everyinc",
        scoreLabel: "Score (0–100)",
        direction: "higher-better",
        scoreExplainer:
          "Graded rewrite of a real vibe-coded codebase that needed a senior engineer. A human senior engineer scores high 80s to low 90s.",
        curatedNote:
          "Every publishes these scores in prose (Vibe Check articles), not as data. This table is hand-curated from their published numbers.",
      },
      retrievedAt: new Date().toISOString(),
      sourceGeneratedAt: "2026-06-09T00:00:00.000Z",
      sourceDataUrl: SOURCE_ARTICLE,
      entries: entries.map((s, i) => ({
        rank: i + 1,
        model: s.model,
        score: s.score,
        display: String(s.score),
      })),
    };
  },
};
