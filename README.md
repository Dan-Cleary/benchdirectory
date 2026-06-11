# IndieBench

**The internet's personal AI benchmarks, in one place.**

The most interesting AI benchmarks right now aren't the academic ones — they're the personal ones. [SnitchBench](https://snitchbench.t3.gg) measures whether a model will report you to the FBI. [BullshitBench](https://github.com/petergpt/bullshit-benchmark) measures whether it calls out nonsense questions. [SlopBench](https://slop-bench.vercel.app) measures how much AI slop it writes. Each lives on its own site, in its own format. IndieBench puts them in one place.

## The one rule: we never re-run a benchmark

Every score on IndieBench comes from the benchmark owner's own published results. The people who built these benches run them, pay for them, and own the methodology — they are the source of truth. IndieBench ingests what they publish, normalizes it, and links back loudly.

## Current benchmarks

| Benchmark | Owner | Source of truth |
|---|---|---|
| SnitchBench | [Theo](https://x.com/theo) | `snitching-analysis.json` in [T3-Content/SnitchBench](https://github.com/T3-Content/SnitchBench) |
| BullshitBench | [Peter Gostev](https://x.com/petergostev) | `data/v2/latest/leaderboard.csv` in [petergpt/bullshit-benchmark](https://github.com/petergpt/bullshit-benchmark) (`data/latest/` is the stale v1 export) |
| SlopBench | [Dan Cleary](https://x.com/DanJCleary) | public leaderboard query on the production [SlopBench](https://slop-bench.vercel.app) backend |

## How it works

```
adapters/*.ts  ──ingest──▶  src/data/*.json  ──build──▶  static site
```

- `adapters/` — one TypeScript file per benchmark. Each fetches the owner's published results (raw JSON/CSV from their repo, or a public API) and normalizes them into one snapshot shape (`adapters/types.ts`).
- `src/data/` — committed snapshots. Diffable, reviewable, no backend.
- `src/` — React/Vite site that renders the snapshots grouped by benchmark.

```sh
npm install
npm run ingest          # refresh all snapshots from sources
npm run ingest -- snitchbench   # refresh one
npm run dev             # local dev server
npm run build           # type-check + production build
```

## Add your benchmark

PRs welcome. To add a bench:

1. Publish your results somewhere structured (a JSON/CSV in your repo is perfect).
2. Copy any file in `adapters/`, point it at your data, fill in the `BenchmarkMeta` (name, owner, links, what the score means, which direction is better).
3. Register it in `adapters/run.ts`, run `npm run ingest`, commit the snapshot.

That's it — the UI picks up new snapshots automatically.

## Freshness

A GitHub Action (`.github/workflows/ingest.yml`) re-ingests every benchmark daily and commits only when an owner actually published new data. Bench owners update on their own schedule — new models trickle in over days after a launch — so daily polling catches everyone without anyone having to coordinate. Each section shows when the owner generated the data (when they publish that) and when we pulled it.

## Roadmap

- More benches (got one? open an issue)
- Cross-bench model report cards — one model, every indie bench
- Bar charts per benchmark
- `benchmark.json` manifest spec so owners can push instead of being pulled

## License

MIT
