# BenchDirectory

**AI benchmarks from curious people, in one place.**

The most interesting AI benchmarks right now aren't the academic ones. They're the personal ones. [SnitchBench](https://snitchbench.t3.gg) measures whether a model will report you to the FBI. [BullshitBench](https://github.com/petergpt/bullshit-benchmark) measures whether it pushes back on a nonsense question. [SlopBench](https://slop-bench.vercel.app) measures how much AI slop a model writes. Each one lives on its own site, in its own format. I kept losing track of them, so I put them in one place.

Every score comes from the person who built the benchmark. They run it and publish the numbers. BenchDirectory pulls those numbers in and links straight back to them, so credit and clicks go to the people doing the work.

## Current benchmarks

| Benchmark | Built by | Where the scores come from |
|---|---|---|
| SnitchBench | [Theo](https://x.com/theo) | `snitching-analysis.json` in [T3-Content/SnitchBench](https://github.com/T3-Content/SnitchBench) |
| BullshitBench | [Peter Gostev](https://x.com/petergostev) | `data/v2/latest/leaderboard.csv` in [petergpt/bullshit-benchmark](https://github.com/petergpt/bullshit-benchmark) (`data/latest/` is the stale v1 export) |
| SlopBench | [Dan Cleary](https://x.com/DanJCleary) | public leaderboard query on the production [SlopBench](https://slop-bench.vercel.app) backend |
| SkateBench | [Theo](https://x.com/theo) | server-rendered leaderboard at [skatebench.t3.gg](https://skatebench.t3.gg) (the committed JSON is a stale v1 run; the live v2 data was never pushed) |
| ScreenshotBench | [Dan Cleary](https://x.com/DanJCleary) | public matrix query on the production [screenshotbench.com](https://screenshotbench.com) backend |
| DeepSWE | [Datacurve](https://deepswe.datacurve.ai) | server-rendered leaderboard at [deepswe.datacurve.ai](https://deepswe.datacurve.ai). No structured export, so the adapter parses the page and fails loudly if the markup changes |
| Planning Benchmark | [bladnman](https://github.com/bladnman) | per-run branches in [bladnman/planning_benchmark](https://github.com/bladnman/planning_benchmark), each branch's `results/PLAN_EVAL.md` |
| Senior Engineer Bench | [Every / Dan Shipper](https://every.to/vibe-check) | hand-curated from the published [Vibe Check](https://every.to/vibe-check) articles (scores live in prose only) |
| CursorBench | [Cursor](https://cursor.com/cursorbench) | hand-curated from the published leaderboard page (the benchmark itself is closed) |

Hand-curated tables are marked in the UI and carry the creator's link. They're the fallback for benches whose owners publish numbers but not data files.

## How it works

```
adapters/*.ts  ──ingest──▶  src/data/*.json  ──build──▶  static site
```

- `adapters/` is one file per benchmark. It grabs the creator's published numbers (raw JSON/CSV from their repo, or a public API) and turns them into a single shape (`adapters/types.ts`).
- `src/data/` is the saved snapshots. Plain JSON you can diff and review, no backend required.
- `src/` is the React/Vite site that renders them, grouped by benchmark.

```sh
npm install
npm run ingest          # refresh every snapshot from its source
npm run ingest -- snitchbench   # refresh just one
npm run dev             # local dev server
npm run build           # type-check + production build
```

## Add your benchmark

Two ways.

Easiest: hit **Submit a bench** on the site and drop a link to your repo. That opens a pre-filled issue and we take it from there.

Or open a PR:

1. Publish your results somewhere structured. A JSON or CSV in your repo is perfect.
2. Copy any file in `adapters/`, point it at your data, and fill in the `BenchmarkMeta` (name, links, what the score means, which direction is better).
3. Register it in `adapters/run.ts`, run `npm run ingest`, and commit the snapshot.

The UI picks up new snapshots on its own.

## Freshness

A GitHub Action re-checks every benchmark daily and commits only when a creator has actually published something new. People update on their own schedule. New models trickle in for days after a launch, so a daily check catches everyone without anyone needing to coordinate. Each section shows when the creator generated the data and when we pulled it.

## Roadmap

- More benches (got one? open an issue or use the submit button)
- Cross-bench model report cards: one model, every indie bench
- Bar charts per benchmark
- A `benchmark.json` manifest so creators can push instead of being pulled

## License

MIT
