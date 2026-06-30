// Unauthenticated GitHub API requests are rate-limited to 60/hour per IP, which
// CI runners blow through (shared IPs) and fail with 403. When a token is in the
// env (Actions always provides GITHUB_TOKEN; locally GH_TOKEN works too), attach
// it to the REST API to get 5,000/hour. Deliberately NOT applied to
// raw.githubusercontent.com: raw serves public files without auth on a separate,
// generous budget, and routing it through the token's quota only adds contention.
function githubHeaders(url: string): Record<string, string> {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token && new URL(url).hostname === "api.github.com") {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Fetch with bounded retry on transient failures (rate-limit, 5xx, network
// blips). Bench sources are public endpoints fetched in bursts — a single
// dropped request shouldn't silently shrink a snapshot, which is how flaky
// adapters (planning-benchmark, deepswe) lost entries.
async function fetchRetry(url: string, tries = 3): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: githubHeaders(url) });
      if (res.ok) return res;
      const transient = res.status === 403 || res.status === 429 || res.status >= 500;
      if (!transient || i === tries - 1) return res;
    } catch (e) {
      lastErr = e;
      if (i === tries - 1) throw e;
    }
    await sleep(400 * 2 ** i); // 400ms, 800ms, …
  }
  throw lastErr ?? new Error(`GET ${url} -> exhausted retries`);
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetchRetry(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchText(url: string): Promise<string> {
  const res = await fetchRetry(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.text();
}

/** Minimal CSV parser — header row + unquoted fields (sufficient for current sources). */
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Record<string, string> = {};
    header.forEach((key, i) => (row[key] = cells[i] ?? ""));
    return row;
  });
}

export function pct(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}
