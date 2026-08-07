import type { Adapter, Entry, Snapshot } from "./types";
import { fetchJson } from "./lib";

// ClawBench by TIGER-AI-Lab (NAIL Group). Agents attempt 153 (v1) / 130 (v2)
// everyday tasks across ~144 live websites. A sandbox interceptor blocks the
// agent's final HTTP request (checkout, submit, post) and an LLM judge checks
// it against the task's eval schema. reward_rate = share of tasks where the
// agent both intercepted the right request AND passed the judge.
//
// The site serves a machine-readable leaderboard at /api/leaderboard.json with
// several row sets (corpus x harness). We use the current v2 corpus on the
// hermes harness (rows_v2_hermes) — the one harness with a full run — so the
// board reflects current frontier models without the empty/partial harness rows.

const API_URL = "https://claw-bench.com/api/leaderboard.json";

interface Row {
  model: string;
  harness: string;
  reward: number; // reward_rate, 0..1
  int_rate: number; // interception rate, 0..1
  intercepted: number;
  n: number;
}

interface Payload {
  generated_at?: string;
  rows_v2_hermes?: Row[];
  rows_v2?: Row[];
}

export const clawbench: Adapter = {
  slug: "clawbench",
  async fetchSnapshot(): Promise<Snapshot> {
    const data = await fetchJson<Payload>(API_URL);

    // Prefer the full-data harness on the current corpus; fall back to the
    // combined v2 set (deduped by model, keeping each model's best reward).
    let rows = data.rows_v2_hermes ?? [];
    if (rows.length < 2) {
      const best = new Map<string, Row>();
      for (const r of data.rows_v2 ?? []) {
        const prev = best.get(r.model);
        if (!prev || r.reward > prev.reward) best.set(r.model, r);
      }
      rows = [...best.values()];
    }

    const entries: Entry[] = rows
      .map((r): Entry => {
        const score = r.reward * 100;
        return {
          rank: 0,
          model: r.model,
          score,
          display: `${score.toFixed(1)}%`,
          extras: [
            { label: "Interception", value: `${(r.int_rate * 100).toFixed(1)}%` },
            { label: "Tasks", value: String(r.n) },
          ],
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    if (entries.length < 2) {
      throw new Error(
        `clawbench: parsed ${entries.length} rows — leaderboard shape likely changed, refusing to publish`,
      );
    }

    return {
      benchmark: {
        slug: "clawbench",
        name: "ClawBench",
        tagline: "Can an agent finish real everyday tasks across 144 live websites?",
        owner: {
          name: "TIGER-AI-Lab (NAIL Group)",
          url: "https://github.com/TIGER-AI-Lab/ClawBench",
        },
        siteUrl: "https://claw-bench.com",
        repoUrl: "https://github.com/TIGER-AI-Lab/ClawBench",
        scoreLabel: "Task success",
        direction: "higher-better",
        scoreExplainer:
          "Share of the 130 v2 tasks where the agent intercepted the correct final request and passed the LLM judge. Interception rate (did it attempt the right action) is shown alongside. Higher is better.",
      },
      retrievedAt: new Date().toISOString(),
      sourceGeneratedAt: data.generated_at
        ? new Date(`${data.generated_at} UTC`).toISOString()
        : undefined,
      sourceDataUrl: API_URL,
      entries,
    };
  },
};
