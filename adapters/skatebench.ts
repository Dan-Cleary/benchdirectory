import type { Adapter, Entry, Snapshot } from "./types";
import { fetchText, pct } from "./lib";

// SkateBench by Theo (t3.gg). Ranks models on how well they name skateboarding
// tricks from technical definitions.
//
// NOTE: the repo's committed benchmark-results.json is STALE (v1 run from
// 2026-02-20, 24 models); the live site ships a newer v2 dataset (390
// definitions, 28 models) embedded in the Next.js build that was never pushed
// to GitHub. So we parse the server-rendered leaderboard on skatebench.t3.gg —
// the owner's canonical, current publication. Rows carry the precise score in
// the bar width (width:96.9%); the page shows Theo's default model selection.
// Fails loudly if the markup changes rather than publishing junk.

const PAGE_URL = "https://skatebench.t3.gg/";

export const skatebench: Adapter = {
  slug: "skatebench",
  async fetchSnapshot(): Promise<Snapshot> {
    const html = await fetchText(PAGE_URL);

    const rowPattern =
      /title="([a-z0-9.\-]+)"[^>]*>\1<\/span>.*?width:(\d+(?:\.\d+)?)%/g;

    const entries: Entry[] = [];
    const seen = new Set<string>();
    for (const m of html.matchAll(rowPattern)) {
      const [, model, rate] = m;
      if (seen.has(model)) continue;
      seen.add(model);
      entries.push({
        rank: entries.length + 1,
        model,
        score: Number(rate),
        display: pct(Number(rate)),
      });
    }
    entries.sort((a, b) => b.score - a.score);
    entries.forEach((e, i) => (e.rank = i + 1));

    if (entries.length < 5) {
      throw new Error(
        `skatebench: parsed only ${entries.length} rows — page structure likely changed, refusing to publish`,
      );
    }

    return {
      benchmark: {
        slug: "skatebench",
        name: "SkateBench",
        tagline: "Can the model name the skateboard trick from its technical definition?",
        owner: { name: "Theo", xHandle: "theo", url: "https://t3.gg" },
        siteUrl: PAGE_URL,
        repoUrl: "https://github.com/T3-Content/skatebench",
        license: "MIT",
        scoreLabel: "Success rate",
        direction: "higher-better",
        scoreExplainer:
          "Share of trick-terminology questions answered correctly (v2: 390 technical trick definitions). Higher means the model knows its skateboarding. Shows the site's default model selection.",
      },
      retrievedAt: new Date().toISOString(),
      sourceDataUrl: PAGE_URL,
      entries,
    };
  },
};
