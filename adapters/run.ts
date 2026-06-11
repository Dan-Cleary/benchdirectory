import { mkdir, readFile, writeFile } from "node:fs/promises";
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

const ADAPTERS: Adapter[] = [
  snitchbench,
  bullshitbench,
  slopbench,
  skatebench,
  screenshotbench,
  deepswe,
  everySeniorEngineer,
  cursorbench,
];

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "../src/data");

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
  const only = process.argv[2];
  const targets = only ? ADAPTERS.filter((a) => a.slug === only) : ADAPTERS;
  if (only && targets.length === 0) {
    console.error(`No adapter named "${only}". Known: ${ADAPTERS.map((a) => a.slug).join(", ")}`);
    process.exit(1);
  }

  await mkdir(DATA_DIR, { recursive: true });
  const results = await Promise.allSettled(
    targets.map(async (adapter) => {
      const snapshot = await adapter.fetchSnapshot();
      const existing = await readExisting(adapter.slug);
      if (existing && stableContent(existing) === stableContent(snapshot)) {
        // Same data the owner last published — keep the old file so the
        // repo stays clean and retrievedAt reflects when the data was new.
        return { slug: adapter.slug, entries: snapshot.entries.length, changed: false };
      }
      await writeFile(
        join(DATA_DIR, `${adapter.slug}.json`),
        JSON.stringify(snapshot, null, 2) + "\n",
      );
      return { slug: adapter.slug, entries: snapshot.entries.length, changed: true };
    }),
  );

  let failed = false;
  for (const r of results) {
    if (r.status === "fulfilled") {
      const mark = r.value.changed ? "updated" : "unchanged";
      console.log(`✓ ${r.value.slug}: ${r.value.entries} entries (${mark})`);
    } else {
      failed = true;
      console.error(`✗ ${r.reason}`);
    }
  }
  if (failed) process.exit(1);
}

main();
