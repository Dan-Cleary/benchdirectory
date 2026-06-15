import type { Adapter, Entry, Snapshot } from "./types";
import { fetchJson, fetchText } from "./lib";

// Planning Benchmark by bladnman. A coding agent reads a real product spec
// (PRD) and produces an implementation plan; an evaluator scores how completely
// the plan covers the spec's requirements (full=1, partial=0.5).
//
// There is no single leaderboard page. Each run lives in its own git branch
// named <model>__<harness>__<effort> with results/PLAN_EVAL.md holding an
// "Overall: ... = NN.NN%" coverage line. We list the run branches, parse each
// score, and model the harness/effort as the variant — which makes this the
// only bench here that shows the SAME model under different coding harnesses.
//
// Caveat (surfaced in the UI): runs were each scored against a freshly
// extracted requirement set (38–87 reqs, sometimes different PRDs), so this is
// indicative of planning coverage, not a strictly apples-to-apples ranking.

const REPO = "bladnman/planning_benchmark";
const BRANCHES_API = `https://api.github.com/repos/${REPO}/branches?per_page=100`;

interface Branch {
  name: string;
}

// Run reports phrase the headline score several ways across branches:
//   "Overall: ... = 89.7%", "Overall score = ... = 42.1%",
//   "score = ... = 49.4%", or only per-severity lines (compute it ourselves).
function parseScore(md: string): { score: number; total: number | null } | null {
  const totalMatch = md.match(/Total:\s*(\d+)\s*requirements/);
  let total = totalMatch ? Number(totalMatch[1]) : null;

  const stated =
    md.match(/overall[^\n]*?=\s*([\d.]+)\s*%/i) ||
    md.match(/^[\s`]*score\s*=[^\n]*?=\s*([\d.]+)\s*%/im);
  if (stated) return { score: Number(stated[1]), total };

  // Fallback: sum the per-severity tallies and apply the benchmark's own
  // formula — (full×1 + partial×0.5) / total. Lets us include runs that only
  // published a severity breakdown with no overall summary line.
  const sev = [
    ...md.matchAll(
      /(?:Critical|Important|Detail)\s*:[^\n]*?\(\s*(\d+)\s*×\s*1(?:\.0)?\s*\+\s*(\d+)\s*×\s*0\.5\s*\)\s*\/\s*(\d+)/gi,
    ),
  ];
  if (sev.length === 0) return null;
  let full = 0,
    partial = 0,
    denom = 0;
  for (const m of sev) {
    full += Number(m[1]);
    partial += Number(m[2]);
    denom += Number(m[3]);
  }
  if (denom === 0) return null;
  if (total === null) total = denom;
  return { score: ((full + partial * 0.5) / denom) * 100, total };
}

function prettyModel(seg: string): string {
  return seg.replace(/_/g, "-").replace(/(\d)-(\d)/g, "$1.$2");
}

function prettyVariant(parts: string[]): string | undefined {
  if (parts.length === 0) return undefined;
  return parts.map((p) => p.replace(/_/g, " ")).join(" · ");
}

export const planningbench: Adapter = {
  slug: "planning-benchmark",
  async fetchSnapshot(): Promise<Snapshot> {
    const branches = await fetchJson<Branch[]>(BRANCHES_API);
    // Run branches are the ones encoding <model>__<harness>... (double underscore).
    const runs = branches.filter((b) => b.name.includes("__"));

    const settled = await Promise.allSettled(
      runs.map(async (b): Promise<Entry | null> => {
        const ref = encodeURIComponent(b.name);
        const md = await fetchText(
          `https://raw.githubusercontent.com/${REPO}/${ref}/results/PLAN_EVAL.md`,
        ).catch(() => "");
        if (!md) return null;
        const parsed = parseScore(md);
        if (parsed === null) return null;

        const label = b.name.replace(/^benchmarks\//, "");
        const [modelSeg, ...rest] = label.split("__");
        return {
          rank: 0,
          model: prettyModel(modelSeg),
          variant: prettyVariant(rest),
          score: parsed.score,
          display: `${parsed.score.toFixed(1)}%`,
          extras: parsed.total ? [{ label: "Requirements", value: String(parsed.total) }] : undefined,
        };
      }),
    );

    const entries = settled
      .filter((r): r is PromiseFulfilledResult<Entry | null> => r.status === "fulfilled")
      .map((r) => r.value)
      .filter((e): e is Entry => e !== null)
      .sort((a, b) => b.score - a.score)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    if (entries.length < 2) {
      throw new Error(
        `planning-benchmark: parsed ${entries.length} runs — branch/markdown layout likely changed, refusing to publish`,
      );
    }

    return {
      benchmark: {
        slug: "planning-benchmark",
        name: "Planning Benchmark",
        tagline:
          "How completely does a coding agent's plan cover a real product spec — and does the harness matter?",
        owner: { name: "bladnman", url: `https://github.com/${REPO}` },
        repoUrl: `https://github.com/${REPO}`,
        scoreLabel: "Coverage",
        direction: "higher-better",
        scoreExplainer:
          "Weighted share of PRD requirements the agent's implementation plan covers (full = 1, partial = 0.5).",
        curatedNote:
          "Each run lives in its own branch and was scored against a freshly extracted requirement set (38–87 reqs, sometimes different PRDs), so read this as indicative of planning coverage — not a strictly apples-to-apples ranking. The variant column is the coding harness, the dimension this bench uniquely isolates.",
      },
      retrievedAt: new Date().toISOString(),
      sourceDataUrl: `${BRANCHES_API} → per-branch results/PLAN_EVAL.md`,
      entries,
    };
  },
};
