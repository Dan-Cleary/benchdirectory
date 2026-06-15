import type { Entry, ScoreDirection } from "../../adapters/types";

// "Best first" ordering that respects the benchmark's direction. For
// lower-better benches (SnitchBench, SlopBench) the smallest score wins.
export function bestFirst(entries: Entry[], direction: ScoreDirection): Entry[] {
  return [...entries].sort((a, b) =>
    direction === "higher-better" ? b.score - a.score : a.score - b.score,
  );
}

// Many benches publish one row per (model, config) — e.g. claude-opus-4.8 at
// reasoning none/low/high/max. For the chart and the default table view we
// keep only each model's best config so one model = one bar.
export function bestPerModel(entries: Entry[], direction: ScoreDirection): Entry[] {
  const best = new Map<string, Entry>();
  for (const e of entries) {
    const cur = best.get(e.model);
    const better =
      !cur ||
      (direction === "higher-better" ? e.score > cur.score : e.score < cur.score);
    if (better) best.set(e.model, e);
  }
  return [...best.values()];
}

export function hasVariants(entries: Entry[]): boolean {
  return entries.some((e) => e.variant);
}

// Normalize a score to a 0..1 "goodness" fill so the best model always gets
// the longest bar, regardless of direction. A small floor keeps the worst
// entry visible. This is what makes a lower-better leaderboard read correctly:
// the winner (smallest number) still gets the fullest bar.
export function goodness(
  value: number,
  min: number,
  max: number,
  direction: ScoreDirection,
): number {
  if (max === min) return 1;
  const g =
    direction === "higher-better"
      ? (value - min) / (max - min)
      : (max - value) / (max - min);
  return 0.06 + g * 0.94;
}

// Pull a number out of a pre-formatted extra value like "$12.58" or "81.3%".
export function parseNum(s: string): number {
  const m = s.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : Number.NEGATIVE_INFINITY;
}
