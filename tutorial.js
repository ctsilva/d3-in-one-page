// Turns every <figure class="example"> into an editable, runnable example.
// The code lives in <script type="text/plain"> so no HTML escaping is needed.
// Modes: "html" runs the text as the body of a page; "js" runs it as a script
// after D3 and the Skubal data are loaded.

const BASE_CSS = `
  body { margin: 12px; font: 14px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; color: #1d1d1b; background: #fff; }
  svg { display: block; }
  pre.log { margin: 8px 0 0; padding: 6px 8px; background: #f6f5f1; border-left: 3px solid #d9d7cf; font: 12px/1.4 ui-monospace, Menlo, Consolas, monospace; white-space: pre-wrap; }
  pre.err { margin: 8px 0 0; padding: 6px 8px; background: #fff0ee; border-left: 3px solid #cc5260; color: #8a1f2b; font: 12px/1.4 ui-monospace, Menlo, Consolas, monospace; white-space: pre-wrap; }
  .tooltip { position: absolute; pointer-events: none; background: #1d1d1b; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
`;

// console.log inside an example prints below the output; errors are shown, not hidden.
const CONSOLE_SHIM = `
  (function () {
    function show(cls, parts) {
      let pre = document.querySelector("pre." + cls);
      if (!pre) { pre = document.createElement("pre"); pre.className = cls; document.body.appendChild(pre); }
      pre.textContent += parts.map(fmt).join(" ") + "\\n";
    }
    // Compact, readable formatting: [97.3, 95.1] and {name: "Sinker", speed: 97.3}.
    function fmt(v) {
      if (typeof v === "string") return v;
      if (v === null || typeof v !== "object") return String(v);
      if (Array.isArray(v)) return "[" + v.map(fmtInner).join(", ") + "]";
      if (v instanceof Map) return "Map {" + [...v].map(([k, x]) => fmtInner(k) + " => " + fmtInner(x)).join(", ") + "}";
      if (v instanceof Set) return "Set {" + [...v].map(fmtInner).join(", ") + "}";
      return "{" + Object.entries(v).map(([k, x]) => k + ": " + fmtInner(x)).join(", ") + "}";
    }
    function fmtInner(v) { return typeof v === "string" ? JSON.stringify(v) : fmt(v);
    }
    const log = console.log.bind(console);
    console.log = (...a) => { log(...a); show("log", a); };
    window.addEventListener("error", e => show("err", [e.message]));
    window.addEventListener("unhandledrejection", e => show("err", [String(e.reason)]));
  })();
`;

// When the page is opened from file://, fetch() cannot read data/skubal.csv.
// Try the real request first and fall back to the embedded copy, so the
// d3.csv examples run either way.
const CSV_SHIM = `
  {
    const realCsv = d3.csv;
    d3.csv = (url, row) => url.endsWith("skubal.csv")
      ? realCsv(url, row).catch(() => d3.csvParse(pitchesCSV, row))
      : realCsv(url, row);
  }
`;

function dedent(text) {
  const lines = text.replace(/^\n+/, "").replace(/\s+$/, "").split("\n");
  const indent = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
  return lines.map(l => l.slice(indent)).join("\n");
}

function buildDoc(mode, code) {
  const head = `<meta charset="utf-8"><style>${BASE_CSS}</style>
    <script src="vendor/d3.v7.min.js"><\/script><script src="data/skubal.js"><\/script>
    <script>${CONSOLE_SHIM}${CSV_SHIM}<\/script>`;
  const body = mode === "html" ? code : `<script>\n${code}\n<\/script>`;
  return `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
}

function setup(figure, index) {
  const src = figure.querySelector("script[type='text/plain']");
  const mode = figure.dataset.mode || "js";
  const original = dedent(src.textContent);
  const height = +figure.dataset.height || 200;
  const title = figure.dataset.title || `Example ${index + 1}`;

  figure.innerHTML = `
    <figcaption><span>${title}</span><span class="mode">${mode === "html" ? "HTML + CSS" : "JavaScript + D3"}</span></figcaption>
    <textarea spellcheck="false" aria-label="${title} source code"></textarea>
    <div class="bar"><button class="run">Run ▶</button><button class="reset">Reset</button>
      <span class="hint">Edit, then Run or press ⌘/Ctrl + Enter</span></div>
    <iframe title="${title} output" style="height:${height}px"></iframe>`;

  const ta = figure.querySelector("textarea");
  const frame = figure.querySelector("iframe");
  ta.value = original;
  ta.rows = Math.min(30, original.split("\n").length + 1);

  const run = () => { frame.srcdoc = buildDoc(mode, ta.value); };
  // Grow the frame to fit its output (checked a few times, since some examples load data asynchronously).
  const fit = () => {
    const doc = frame.contentDocument;
    if (doc && doc.body) frame.style.height = Math.max(height, doc.body.scrollHeight + 24) + "px";
  };
  frame.addEventListener("load", () => [50, 300, 1000, 2500].forEach(t => setTimeout(fit, t)));
  figure.querySelector(".run").addEventListener("click", run);
  figure.querySelector(".reset").addEventListener("click", () => { ta.value = original; run(); });
  ta.addEventListener("keydown", e => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); run(); }
    if (e.key === "Tab") {  // insert two spaces instead of leaving the editor
      e.preventDefault();
      const s = ta.selectionStart, t = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + "  " + ta.value.slice(t);
      ta.selectionStart = ta.selectionEnd = s + 2;
    }
  });
  return run;
}

const runners = new Map();
document.querySelectorAll("figure.example").forEach((fig, i) => runners.set(fig, setup(fig, i)));

// Run each example the first time it scrolls into view.
const seen = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { runners.get(e.target)(); seen.unobserve(e.target); }
}, { rootMargin: "300px 0px" });
runners.forEach((_, fig) => seen.observe(fig));

// Highlight the current section in the table of contents.
const links = [...document.querySelectorAll("nav.toc a")];
const byId = new Map(links.map(a => [a.getAttribute("href").slice(1), a]));
const spy = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) {
    links.forEach(a => a.classList.remove("active"));
    byId.get(e.target.id)?.classList.add("active");
  }
}, { rootMargin: "-10% 0px -80% 0px" });
document.querySelectorAll("section[id]").forEach(s => spy.observe(s));
