import { useMemo, useState } from "react";
import type { Snapshot } from "../../adapters/types";
import { ScoreChart } from "./ScoreChart";
import { bestFirst, bestPerModel, goodness, hasVariants, parseNum } from "../lib/rank";

const COLLAPSED_ROWS = 10;
const SCORE_KEY = "__score__";

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export function BenchmarkCard({ snapshot }: { snapshot: Snapshot }) {
  const { benchmark: b, entries, retrievedAt, sourceGeneratedAt } = snapshot;
  const variants = hasVariants(entries);

  const [expanded, setExpanded] = useState(false);
  const [collapseVariants, setCollapseVariants] = useState(true);
  // sort: which column drives the TABLE order. `null` key = canonical best-first.
  const [sortKey, setSortKey] = useState<string>(SCORE_KEY);
  const [ascending, setAscending] = useState<boolean>(b.direction === "lower-better");

  const extraLabels = entries[0]?.extras?.map((x) => x.label) ?? [];

  // Canonical ranking: collapse variants (optional) then order best-first.
  // Rank numbers come from this and stay fixed even when the table is re-sorted.
  const ranked = useMemo(() => {
    const base = variants && collapseVariants ? bestPerModel(entries, b.direction) : entries;
    return bestFirst(base, b.direction).map((e, i) => ({ ...e, rank: i + 1 }));
  }, [entries, variants, collapseVariants, b.direction]);

  // Table order: apply the active column sort on top of the canonical set.
  const tableEntries = useMemo(() => {
    const rows = [...ranked];
    rows.sort((a, b2) => {
      let base: number;
      if (sortKey === SCORE_KEY) {
        base = a.score - b2.score;
      } else {
        const av = parseNum(a.extras?.find((x) => x.label === sortKey)?.value ?? "");
        const bv = parseNum(b2.extras?.find((x) => x.label === sortKey)?.value ?? "");
        base = av - bv;
      }
      return ascending ? base : -base;
    });
    return rows;
  }, [ranked, sortKey, ascending]);

  const visible = expanded ? tableEntries : tableEntries.slice(0, COLLAPSED_ROWS);
  const scores = ranked.map((e) => e.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setAscending((v) => !v);
    } else {
      setSortKey(key);
      // Sensible first direction: score → best-first; extras → high-first.
      setAscending(key === SCORE_KEY ? b.direction === "lower-better" : false);
    }
  }

  const arrow = (key: string) =>
    sortKey === key ? (ascending ? " ↑" : " ↓") : "";

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
        <span className="direction-hint">
          {b.direction === "lower-better" ? "Lower is better." : "Higher is better."}
        </span>{" "}
        <span className="freshness" title={retrievedAt}>
          {sourceGeneratedAt
            ? `Owner's export generated ${timeAgo(sourceGeneratedAt)}; pulled ${timeAgo(retrievedAt)}.`
            : `Data pulled ${timeAgo(retrievedAt)} from the owner's published results.`}
        </span>
      </p>

      {b.curatedNote && <p className="curated-note">✎ {b.curatedNote}</p>}

      <ScoreChart entries={tableEntries} direction={b.direction} />

      {variants && (
        <div className="bench-controls">
          <button
            className="chip"
            onClick={() => setCollapseVariants((v) => !v)}
            aria-pressed={collapseVariants}
          >
            {collapseVariants
              ? `Best config per model · show all ${entries.length} variants`
              : `Showing all variants · collapse to best per model`}
          </button>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th className="num">#</th>
            <th>Model</th>
            <th
              className="num sortable"
              onClick={() => toggleSort(SCORE_KEY)}
              aria-sort={sortKey === SCORE_KEY ? (ascending ? "ascending" : "descending") : "none"}
            >
              {b.scoreLabel}
              {arrow(SCORE_KEY)}
            </th>
            <th className="bar-col" aria-hidden="true"></th>
            {extraLabels.map((label) => (
              <th
                key={label}
                className="num extra sortable"
                onClick={() => toggleSort(label)}
                aria-sort={sortKey === label ? (ascending ? "ascending" : "descending") : "none"}
              >
                {label}
                {arrow(label)}
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
                  className="bar"
                  style={{ width: `${goodness(e.score, min, max, b.direction) * 100}%` }}
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

      {tableEntries.length > COLLAPSED_ROWS && (
        <button className="expand" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Show top 10" : `Show all ${tableEntries.length}`}
        </button>
      )}
    </section>
  );
}

function ownerLink(b: Snapshot["benchmark"]): string {
  if (b.owner.xHandle) return `https://x.com/${b.owner.xHandle}`;
  return b.owner.url ?? b.repoUrl;
}
