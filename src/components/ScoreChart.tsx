import type { Entry } from "../../adapters/types";

const MAX_BARS = 12;
const W = 840;
const CHART_H = 150;
const LABEL_H = 78;
const GAP = 6;

function shortLabel(e: Entry): string {
  const name = e.variant ? `${e.model} ${e.variant.replace("reasoning=", "")}` : e.model;
  return name.length > 18 ? `${name.slice(0, 17)}…` : name;
}

export function ScoreChart({ entries }: { entries: Entry[] }) {
  const shown = entries.slice(0, MAX_BARS);
  if (shown.length < 2) return null;
  const max = Math.max(...shown.map((e) => e.score), 0.0001);
  const barW = (W - GAP * (shown.length - 1)) / shown.length;

  return (
    <svg
      className="score-chart"
      viewBox={`0 0 ${W} ${CHART_H + LABEL_H}`}
      role="img"
      aria-label={`Bar chart of the top ${shown.length} scores`}
    >
      {shown.map((e, i) => {
        const h = Math.max((e.score / max) * (CHART_H - 22), 2);
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
