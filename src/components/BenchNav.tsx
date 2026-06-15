import { useEffect, useState } from "react";
import type { Snapshot } from "../../adapters/types";

// Sticky pill nav: every bench reachable in one click, with the current
// section highlighted as you scroll.
export function BenchNav({ snapshots }: { snapshots: Snapshot[] }) {
  const [active, setActive] = useState<string | null>(snapshots[0]?.benchmark.slug ?? null);

  useEffect(() => {
    const sections = snapshots
      .map((s) => document.getElementById(s.benchmark.slug))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const onscreen = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (onscreen[0]) setActive(onscreen[0].target.id);
      },
      // Trigger when a section's top reaches just under the sticky nav.
      { rootMargin: "-90px 0px -65% 0px", threshold: 0 },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [snapshots]);

  function jump(slug: string) {
    document.getElementById(slug)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className="bench-nav" aria-label="Benchmarks">
      {snapshots.map((s) => (
        <button
          key={s.benchmark.slug}
          className={`nav-pill${active === s.benchmark.slug ? " active" : ""}`}
          onClick={() => jump(s.benchmark.slug)}
        >
          {s.benchmark.name}
        </button>
      ))}
    </nav>
  );
}
