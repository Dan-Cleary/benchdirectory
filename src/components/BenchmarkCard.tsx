import { useState } from "react";
import type { Snapshot } from "../../adapters/types";
import { ScoreChart } from "./ScoreChart";

const COLLAPSED_ROWS = 10;

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export function BenchmarkCard({ snapshot }: { snapshot: Snapshot }) {
  const { benchmark: b, entries, retrievedAt, sourceGeneratedAt } = snapshot;
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? entries : entries.slice(0, COLLAPSED_ROWS);
  const maxScore = Math.max(...entries.map((e) => e.score), 0.0001);
  const extraLabels = entries[0]?.extras?.map((x) => x.label) ?? [];

  return (
    <section className="bench" id={b.slug}>
      <div className="bench-head">
        <div>
          <h2>{b.name}</h2>
          <p className="bench-tagline">{b.tagline}</p>
        </div>
        <div className="bench-links">
          <a className="owner" href={ownerLink(b)} target="_blank" rel="noreferrer">
            by {b.owner.name}
            {b.owner.xHandle ? ` (@${b.owner.xHandle})` : ""}
          </a>
          {b.siteUrl && (
            <a href={b.siteUrl} target="_blank" rel="noreferrer">
              site
            </a>
          )}
          <a href={b.repoUrl} target="_blank" rel="noreferrer">
            repo
          </a>
        </div>
      </div>

      <p className="score-explainer">
        {b.scoreExplainer}{" "}
        <span className="freshness" title={retrievedAt}>
          {sourceGeneratedAt
            ? `Owner's export generated ${timeAgo(sourceGeneratedAt)}; pulled ${timeAgo(retrievedAt)}.`
            : `Data pulled ${timeAgo(retrievedAt)} from the owner's published results.`}
        </span>
      </p>

      {b.curatedNote && <p className="curated-note">✎ {b.curatedNote}</p>}

      <ScoreChart entries={entries} />

      <table>
        <thead>
          <tr>
            <th className="num">#</th>
            <th>Model</th>
            <th className="num">{b.scoreLabel}</th>
            <th className="bar-col" aria-hidden="true"></th>
            {extraLabels.map((label) => (
              <th key={label} className="num extra">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((e) => (
            <tr key={`${e.model}-${e.variant ?? ""}`}>
              <td className="num rank">{e.rank}</td>
              <td>
                <span className="model">{e.model}</span>
                {e.variant && <span className="variant">{e.variant}</span>}
              </td>
              <td className="num score">{e.display}</td>
              <td className="bar-col">
                <div
                  className={`bar ${b.direction}`}
                  style={{ width: `${(e.score / maxScore) * 100}%` }}
                />
              </td>
              {extraLabels.map((label) => (
                <td key={label} className="num extra">
                  {e.extras?.find((x) => x.label === label)?.value ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {entries.length > COLLAPSED_ROWS && (
        <button className="expand" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Show top 10" : `Show all ${entries.length}`}
        </button>
      )}
    </section>
  );
}

function ownerLink(b: Snapshot["benchmark"]): string {
  if (b.owner.xHandle) return `https://x.com/${b.owner.xHandle}`;
  return b.owner.url ?? b.repoUrl;
}
