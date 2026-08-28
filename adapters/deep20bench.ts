import type { Adapter, Snapshot } from "./types";
import { fetchJson, pct } from "./lib";

// Deep20Bench evaluates how efficiently a model identifies a hidden person or
// character by asking adaptive yes-or-no questions. The project publishes a
// generated leaderboard and supporting evidence for every official run.

const DATA_URL =
  "https://mindalyze-com.github.io/deep-20-bench/data/leaderboard.json";
const MANIFEST_URL =
  "https://mindalyze-com.github.io/deep-20-bench/data/manifest.json";

interface Deep20Model {
  display_name: string;
  route: string;
}

interface ConfidenceInterval {
  lower: string;
  upper: string;
  trial_count: number;
}

interface Deep20Entry {
  rank: number;
  model: Deep20Model;
  question_score: string;
  question_score_confidence_interval: ConfidenceInterval;
  success_rate: string;
  total_cost_usd: string;
}

interface Deep20Leaderboard {
  leaderboard: Deep20Entry[];
}

interface Deep20Manifest {
  provenance?: {
    built_at?: string;
  };
}

const MODEL_ORGS: Record<string, string> = {
  anthropic: "Anthropic",
  google: "Google",
  "meta-llama": "Meta",
  mistralai: "Mistral AI",
  moonshotai: "Moonshot AI",
  openai: "OpenAI",
  stealth: "Stealth",
  "x-ai": "xAI",
};

function modelOrg(route: string): string | undefined {
  return MODEL_ORGS[route.split("/")[0]];
}

export const deep20bench: Adapter = {
  slug: "deep20bench",
  async fetchSnapshot(): Promise<Snapshot> {
    const [raw, manifest] = await Promise.all([
      fetchJson<Deep20Leaderboard>(DATA_URL),
      fetchJson<Deep20Manifest>(MANIFEST_URL),
    ]);

    return {
      benchmark: {
        slug: "deep20bench",
        name: "Deep20Bench",
        tagline:
          "How efficiently can a model identify a hidden person or character by asking yes-or-no questions?",
        owner: {
          name: "Patrick Heusser and Markus Tuor",
          url: "https://github.com/mindalyze-com",
        },
        siteUrl: "https://mindalyze-com.github.io/deep-20-bench/",
        repoUrl: "https://github.com/mindalyze-com/deep-20-bench",
        license: "CC BY 4.0",
        scoreLabel: "Question score",
        direction: "lower-better",
        scoreExplainer:
          "Average counted questions and guesses per trial, with failed trials scored as 51. Lower means the model identified the hidden subject more efficiently.",
      },
      retrievedAt: new Date().toISOString(),
      sourceGeneratedAt: manifest.provenance?.built_at,
      sourceDataUrl: DATA_URL,
      entries: raw.leaderboard.map((entry) => {
        const score = Number(entry.question_score);
        const ci = entry.question_score_confidence_interval;
        return {
          rank: entry.rank,
          model: entry.model.display_name,
          org: modelOrg(entry.model.route),
          score,
          display: score.toFixed(2),
          extras: [
            { label: "Success", value: pct(Number(entry.success_rate) * 100) },
            {
              label: "95% CI",
              value: `${Number(ci.lower).toFixed(2)}-${Number(ci.upper).toFixed(2)}`,
            },
            { label: "Trials", value: String(ci.trial_count) },
            {
              label: "Total cost",
              value: `$${Number(entry.total_cost_usd).toFixed(2)}`,
            },
          ],
        };
      }),
    };
  },
};
