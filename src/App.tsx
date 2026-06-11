import type { Snapshot } from "../adapters/types";
import { BenchmarkCard } from "./components/BenchmarkCard";

const modules = import.meta.glob<{ default: Snapshot }>("./data/*.json", {
  eager: true,
});

const ORDER = ["snitchbench", "bullshitbench", "slopbench"];

const snapshots = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => {
    const ia = ORDER.indexOf(a.benchmark.slug);
    const ib = ORDER.indexOf(b.benchmark.slug);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

export default function App() {
  return (
    <div className="page">
      <header className="hero">
        <h1>
          Indie<span className="accent">Bench</span>
        </h1>
        <p className="tagline">
          The internet's personal AI benchmarks, in one place.
        </p>
        <p className="principle">
          Every score below comes from the benchmark owner's own published
          runs. We never re-run a benchmark — the people who built them are
          the source of truth. Click through and follow them.
        </p>
      </header>

      <main>
        {snapshots.map((s) => (
          <BenchmarkCard key={s.benchmark.slug} snapshot={s} />
        ))}
      </main>

      <footer className="footer">
        <p>
          Open source — add your benchmark with one adapter file.{" "}
          <a href="https://github.com/Dan-Cleary/indiebench">GitHub</a>
        </p>
      </footer>
    </div>
  );
}
