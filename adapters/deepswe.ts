import type { Adapter, Entry, Snapshot } from "./types";
import { fetchText } from "./lib";

// DeepSWE by Datacurve. 113 contamination-free, long-horizon SWE tasks across
// 91 repos / 5 languages; Pass@1 per model. No structured export is published,
// so this is our one HTML-parse fallback: the leaderboard is server-rendered
// into the homepage in a stable row structure. If parsing yields too few rows,
// we fail loudly rather than publish junk.

const PAGE_URL = "https://deepswe.datacurve.ai/";

export const deepswe: Adapter = {
  slug: "deepswe",
  async fetchSnapshot(): Promise<Snapshot> {
    const html = await fetchText(PAGE_URL);

    // Rows look like:
    //   <span class="truncate font-medium text-foreground">claude-opus-4.8</span>
    //   <span class="shrink-0 text-muted-foreground">[<!-- -->max<!-- -->]</span>
    //   ... <span class="font-medium text-foreground">58<!-- -->%</span>
    //   ... ±<!-- -->2<!-- -->% ... Avg cost <span ...>$12.58</span>
    const rowPattern =
      /<span class="truncate font-medium text-foreground">([a-z0-9.\-]+)<\/span>(?:<span class="shrink-0 text-muted-foreground">\[<!-- -->(\w+)<!-- -->\]<\/span>)?[\s\S]{0,600}?<span class="font-medium text-foreground">(\d{1,3})<!-- -->%<\/span><span[^>]*>±<!-- -->(\d+)<!-- -->%/g;

    const seen = new Set<string>();
    const entries: Entry[] = [];
    for (const m of html.matchAll(rowPattern)) {
      const [, model, effort, score, ci] = m;
      const key = `${model}@${effort ?? ""}`;
      if (seen.has(key)) continue; // page renders desktop + mobile variants
      seen.add(key);
      entries.push({
        rank: entries.length + 1,
        model,
        variant: effort,
        score: Number(score),
        display: `${score}%`,
        extras: [{ label: "± CI", value: `${ci}%` }],
      });
    }
    entries.sort((a, b) => b.score - a.score);
    entries.forEach((e, i) => (e.rank = i + 1));

    if (entries.length < 5) {
      throw new Error(
        `deepswe: parsed only ${entries.length} rows — page structure likely changed, refusing to publish`,
      );
    }

    const updated = html.match(
      /Updated\s*(?:<[^>]+>)?\s*([A-Z][a-z]+ \d{1,2}, \d{4})/,
    );

    return {
      benchmark: {
        slug: "deepswe",
        name: "DeepSWE",
        tagline: "113 contamination-free, long-horizon software engineering tasks across 91 repos.",
        owner: { name: "Datacurve", url: "https://datacurve.ai" },
        siteUrl: "https://deepswe.datacurve.ai",
        repoUrl: "https://github.com/datacurve-ai/deep-swe",
        scoreLabel: "Pass@1",
        direction: "higher-better",
        scoreExplainer:
          "Share of tasks solved on the first attempt, run on mini-swe-agent for consistency. Tasks are written from scratch so no model saw the solutions in training.",
      },
      retrievedAt: new Date().toISOString(),
      sourceGeneratedAt: updated ? new Date(`${updated[1]} UTC`).toISOString() : undefined,
      sourceDataUrl: PAGE_URL,
      entries,
    };
  },
};
