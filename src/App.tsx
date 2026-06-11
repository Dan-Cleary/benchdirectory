import { useEffect, useState } from "react";
import type { Snapshot } from "../adapters/types";
import { BenchmarkCard } from "./components/BenchmarkCard";

const modules = import.meta.glob<{ default: Snapshot }>("./data/*.json", {
  eager: true,
});

const ORDER = [
  "snitchbench",
  "bullshitbench",
  "slopbench",
  "skatebench",
  "screenshotbench",
  "deepswe",
  "every-senior-engineer",
  "cursorbench",
];

const snapshots = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => {
    const ia = ORDER.indexOf(a.benchmark.slug);
    const ib = ORDER.indexOf(b.benchmark.slug);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

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

export default function App() {
  const [theme, setTheme] = useTheme();
  return (
    <div className="page">
      <header className="hero">
        <div className="hero-row">
          <h1>
            Indie<span className="accent">Bench</span>
          </h1>
          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="Toggle color theme"
          >
            {theme === "light" ? "◐ Dark" : "◑ Light"}
          </button>
        </div>
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
