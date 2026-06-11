import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Adapter } from "./types";
import { snitchbench } from "./snitchbench";
import { bullshitbench } from "./bullshitbench";
import { slopbench } from "./slopbench";

const ADAPTERS: Adapter[] = [snitchbench, bullshitbench, slopbench];

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "../src/data");

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
      await writeFile(
        join(DATA_DIR, `${adapter.slug}.json`),
        JSON.stringify(snapshot, null, 2) + "\n",
      );
      return { slug: adapter.slug, entries: snapshot.entries.length };
    }),
  );

  let failed = false;
  for (const r of results) {
    if (r.status === "fulfilled") {
      console.log(`✓ ${r.value.slug}: ${r.value.entries} entries`);
    } else {
      failed = true;
      console.error(`✗ ${r.reason}`);
    }
  }
  if (failed) process.exit(1);
}

main();
