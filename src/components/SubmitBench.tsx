import { useEffect, useRef, useState } from "react";

const REPO = "Dan-Cleary/benchdirectory";

// Build a pre-filled GitHub issue URL. No backend: the submission becomes an
// issue labeled "bench-submission", which the weekly keeper routine triages.
function issueUrl(url: string, note: string): string {
  const body = [
    "**Benchmark source URL**",
    url.trim(),
    "",
    "**Anything else?** (who owns it, what the score means; optional)",
    note.trim() || "_(none)_",
    "",
    "---",
    "The one rule: BenchDirectory never re-runs a benchmark. We ingest the",
    "owner's own published results. A structured data file (JSON/CSV) in the",
    "repo is ideal; a public results page works too.",
  ].join("\n");
  const params = new URLSearchParams({
    labels: "bench-submission",
    title: `Bench submission: ${url.trim()}`,
    body,
  });
  return `https://github.com/${REPO}/issues/new?${params.toString()}`;
}

export function SubmitBench() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // GitHub repo URLs only — github.com/<owner>/<repo>. Keeps the submission
  // funnel pointed at sources we can actually inspect, and screens out junk
  // links before an issue is ever created.
  const valid = /^https?:\/\/(www\.)?github\.com\/[^/\s]+\/[^/\s]+/i.test(
    url.trim(),
  );
  const showError = url.trim().length > 0 && !valid;

  function submit() {
    if (!valid) return;
    window.open(issueUrl(url, note), "_blank", "noopener,noreferrer");
    setOpen(false);
    setUrl("");
    setNote("");
  }

  return (
    <>
      <button className="submit-btn" onClick={() => setOpen(true)}>
        + Submit a bench
      </button>

      {open && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-title"
          >
            <h2 id="submit-title">Add your benchmark</h2>
            <p className="modal-sub">
              Drop your benchmark's GitHub repo and we'll review it
              automatically. We never re-run a benchmark. We ingest the results
              you publish, so a structured data file (JSON/CSV) in the repo is
              ideal.
            </p>

            <label className="modal-label" htmlFor="submit-url">
              GitHub repo URL <span className="req">required</span>
            </label>
            <input
              id="submit-url"
              ref={inputRef}
              className="modal-input"
              type="url"
              placeholder="https://github.com/you/your-benchmark"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              aria-invalid={showError}
            />
            {showError && (
              <p className="modal-error">
                Must be a GitHub repo link (github.com/owner/repo). That's where
                we read your published results from.
              </p>
            )}

            <label className="modal-label" htmlFor="submit-note">
              Anything else? <span className="opt">optional</span>
            </label>
            <textarea
              id="submit-note"
              className="modal-input modal-textarea"
              placeholder="Who owns it, what the score means…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                className="modal-submit"
                disabled={!valid}
                onClick={submit}
              >
                Open submission issue →
              </button>
            </div>
            <p className="modal-foot">
              Opens a pre-filled GitHub issue. Just hit submit there.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
