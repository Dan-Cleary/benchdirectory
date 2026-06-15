import type { Entry, ScoreDirection } from "../../adapters/types";
import { goodness } from "../lib/rank";

const MAX_BARS = 12;
const W = 840;
const CHART_H = 150;
const LABEL_H = 78;
const GAP = 6;

function shortLabel(e: Entry): string {
  const name = e.variant ? `${e.model} ${e.variant.replace("reasoning=", "")}` : e.model;
  return name.length > 18 ? `${name.slice(0, 17)}…` : name;
}

// `entries` arrive already in best-first order. The leftmost bar is the winner;
// fill length is goodness-normalized so the winner is always the longest bar,
// even for lower-better benches where the winning score is the smallest number.
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
      viewBox={`0 0 ${W} ${CHART_H + LABEL_H}`}
      role="img"
      aria-label={`Bar chart of the top ${shown.length} models, best first`}
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
              className={i === 0 ? "chart-bar chart-bar-top" : "chart-bar"}
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
