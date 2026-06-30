import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Adapter, Snapshot } from "./types";
import { snitchbench } from "./snitchbench";
import { bullshitbench } from "./bullshitbench";
import { slopbench } from "./slopbench";
import { skatebench } from "./skatebench";
import { screenshotbench } from "./screenshotbench";
import { deepswe } from "./deepswe";
import { everySeniorEngineer } from "./curated/every-senior-engineer";
import { cursorbench } from "./curated/cursorbench";
import { planningbench } from "./planningbench";

const ADAPTERS: Adapter[] = [
  snitchbench,
  bullshitbench,
  slopbench,
  skatebench,
  screenshotbench,
  deepswe,
  planningbench,
  everySeniorEngineer,
  cursorbench,
];

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = join(ROOT, "src/data");

// Convex push config: locally from .env.local, in CI from action env.
// If either var is missing we still write snapshot files, just skip the push.
function loadEnv(): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = { ...process.env };
  const envFile = join(ROOT, ".env.local");
  if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2];
    }
  }
  return env;
}

async function pushToConvex(
  env: Record<string, string | undefined>,
  snapshot: Snapshot,
): Promise<"pushed" | "skipped"> {
  const url = env.VITE_CONVEX_URL;
  const secret = env.INGEST_SECRET;
  if (!url || !secret) return "skipped";
  const res = await fetch(`${url}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "snapshots:upsert",
      // JSON round-trip drops undefined optional fields, matching the schema
      args: {
        secret,
        slug: snapshot.benchmark.slug,
        data: JSON.parse(JSON.stringify(snapshot)),
      },
      format: "json",
    }),
  });
  const body = (await res.json()) as { status: string; errorMessage?: string };
  if (!res.ok || body.status !== "success") {
    throw new Error(
      `convex push ${snapshot.benchmark.slug}: ${body.errorMessage ?? res.status}`,
    );
  }
  return "pushed";
}

/** Everything except retrievedAt — the parts that mean "the data changed". */
function stableContent(s: Snapshot): string {
  const { retrievedAt: _ignored, ...rest } = s;
  return JSON.stringify(rest);
}

async function readExisting(slug: string): Promise<Snapshot | null> {
  try {
    return JSON.parse(await readFile(join(DATA_DIR, `${slug}.json`), "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  // Writing to the live Convex backend is opt-in: --push, INGEST_PUSH=1, or
  // running in CI (GitHub Actions sets CI=true, which is how the daily Action
  // pushes). A plain local `npm run ingest` does none of these, so it only
  // refreshes local snapshot files and can never accidentally clobber prod.
  const bootEnv = loadEnv();
  const wantPush =
    args.includes("--push") || bootEnv.INGEST_PUSH === "1" || bootEnv.CI === "true";
  const only = args.find((a) => !a.startsWith("--"));
  const targets = only ? ADAPTERS.filter((a) => a.slug === only) : ADAPTERS;
  if (only && targets.length === 0) {
    console.error(`No adapter named "${only}". Known: ${ADAPTERS.map((a) => a.slug).join(", ")}`);
    process.exit(1);
  }

  const env = loadEnv();
  await mkdir(DATA_DIR, { recursive: true });
  const results = await Promise.allSettled(
    targets.map(async (adapter) => {
      const snapshot = await adapter.fetchSnapshot();
      const existing = await readExisting(adapter.slug);
      const changed = !existing || stableContent(existing) !== stableContent(snapshot);
      if (changed) {
        await writeFile(
          join(DATA_DIR, `${adapter.slug}.json`),
          JSON.stringify(snapshot, null, 2) + "\n",
        );
      }
      // Push the canonical on-disk snapshot (preserves retrievedAt when
      // unchanged). Upsert is idempotent, so push every run — this also
      // heals a fresh/empty Convex deployment without any data changing.
      const canonical = changed ? snapshot : (existing as Snapshot);
      const push = wantPush ? await pushToConvex(env, canonical) : "skipped";
      return { slug: adapter.slug, entries: canonical.entries.length, changed, push };
    }),
  );

  const failures: string[] = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled") {
      const mark = r.value.changed ? "updated" : "unchanged";
      console.log(`✓ ${r.value.slug}: ${r.value.entries} entries (${mark}, convex ${r.value.push})`);
    } else {
      // A failed adapter keeps its previous snapshot (we never overwrite on
      // throw) and is SKIPPED — one flaky source must not freeze the others.
      failures.push(targets[i].slug);
      console.error(`✗ ${targets[i].slug} skipped: ${r.reason}`);
    }
  }
  if (failures.length) {
    console.error(`\n${failures.length}/${targets.length} skipped: ${failures.join(", ")}`);
  }
  // Only a hard fail (every target broke) exits non-zero. Partial success still
  // commits/pushes the healthy benches and keeps the daily run green.
  if (failures.length === targets.length) process.exit(1);
}

main();
