import type { Entry, ScoreDirection } from "../../adapters/types";
import { goodness } from "../lib/rank";

const MAX_BARS = 12;
const W = 840;
const CHART_H = 150;
const LABEL_H = 78;
const GAP = 6;
// Labels are rotated up-and-to-the-left, so the first bar's label overhangs the
// left edge. Pad the viewBox on both sides (left for the overhang, a little
// right for symmetry) instead of clipping it.
const PAD_L = 96;
const PAD_R = 16;

function shortLabel(e: Entry): string {
  const name = e.variant ? `${e.model} ${e.variant.replace("reasoning=", "")}` : e.model;
  return name.length > 18 ? `${name.slice(0, 17)}…` : name;
}

// `entries` arrive in the table's current order (re-sorting the table reorders
// the bars too). Bar height is goodness-normalized so the best score is always
// the tallest bar — even for lower-better benches where the winner is the
// smallest number — and the rank-1 model keeps the accent fill wherever it lands.
export function ScoreChart({
  entries,
  direction,
}: {
  entries: Entry[];
  direction: ScoreDirection;
}) {
  const shown = entries.slice(0, MAX_BARS);
  if (shown.length < 2) return null;
  const scores = shown.map((e) => e.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const barW = (W - GAP * (shown.length - 1)) / shown.length;

  return (
    <svg
      className="score-chart"
      viewBox={`${-PAD_L} 0 ${W + PAD_L + PAD_R} ${CHART_H + LABEL_H}`}
      role="img"
      aria-label={`Bar chart of ${shown.length} models, ordered to match the table`}
    >
      {shown.map((e, i) => {
        const fill = goodness(e.score, min, max, direction);
        const h = Math.max(fill * (CHART_H - 22), 2);
        const x = i * (barW + GAP);
        const y = CHART_H - h;
        return (
          <g key={`${e.model}-${e.variant ?? ""}`}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={3}
              className={e.rank === 1 ? "chart-bar chart-bar-top" : "chart-bar"}
            />
            <text x={x + barW / 2} y={y - 7} textAnchor="middle" className="chart-value">
              {e.display}
            </text>
            <text
              x={x + barW / 2}
              y={CHART_H + 14}
              textAnchor="end"
              transform={`rotate(-38 ${x + barW / 2} ${CHART_H + 14})`}
              className="chart-label"
            >
              {shortLabel(e)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
