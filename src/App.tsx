import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Snapshot } from "../adapters/types";
import { BenchmarkCard } from "./components/BenchmarkCard";
import { BenchNav } from "./components/BenchNav";
import { SubmitBench } from "./components/SubmitBench";

const ORDER = [
  "snitchbench",
  "bullshitbench",
  "slopbench",
  "skatebench",
  "screenshotbench",
  "deepswe",
  "planning-benchmark",
  "every-senior-engineer",
  "cursorbench",
];

type Theme = "light" | "dark";

function useTheme() {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) ?? "light",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);
  return [theme, setTheme] as const;
}

// Bundled snapshots, committed in src/data and shipped in the JS bundle.
// They render instantly on first paint so there's no "loading" flash; Convex
// (live, possibly fresher) overrides them as soon as its socket connects.
const bundled = Object.values(
  import.meta.glob<{ default: Snapshot }>("./data/*.json", { eager: true }),
).map((m) => m.default);

function byOrder(a: Snapshot, b: Snapshot) {
  const ia = ORDER.indexOf(a.benchmark.slug);
  const ib = ORDER.indexOf(b.benchmark.slug);
  return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
}

export default function App() {
  const [theme, setTheme] = useTheme();
  const docs = useQuery(api.snapshots.list);
  const live = docs?.map((d) => d.data as Snapshot);
  // Prefer live Convex data; fall back to bundled so the page is never empty.
  // Covers an empty-list result too, not just the loading state.
  const snapshots = [...((live?.length ?? 0) > 0 ? live! : bundled)].sort(byOrder);

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-row">
          <h1>
            Bench<span className="accent">Directory</span>
          </h1>
          <div className="hero-actions">
            <SubmitBench />
            <button
              className="theme-toggle"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label="Toggle color theme"
            >
              {theme === "light" ? "◐ Dark" : "◑ Light"}
            </button>
          </div>
        </div>
        <p className="tagline">
          The internet's personal AI benchmarks, in one place.
        </p>
        <p className="principle">
          Every score comes from the person who built the benchmark. They run
          it and publish the numbers. Click through and follow them.
        </p>
      </header>

      {snapshots.length > 0 && <BenchNav snapshots={snapshots} />}

      <main>
        {snapshots.map((s) => (
          <BenchmarkCard key={s.benchmark.slug} snapshot={s} />
        ))}
      </main>

      <footer className="footer">
        <p>
          Got a benchmark? <SubmitBench /> or open a PR with one adapter
          file. <a href="https://github.com/Dan-Cleary/benchdirectory">GitHub</a>
        </p>
      </footer>
    </div>
  );
}
