// Turns every <figure class="example"> into an editable, runnable example.
// The code lives in <script type="text/plain"> so no HTML escaping is needed.
// Modes: "html" runs the text as the body of a page; "js" runs it as a script
// after D3 and the Skubal data are loaded. Pages with <body data-helpers> also load
// helpers.js into every example; the D3 tutorial does not, so its examples can define
// names like chart or row freely.

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

const HELPERS = document.body.hasAttribute("data-helpers");

function dedent(text) {
  const lines = text.replace(/^\n+/, "").replace(/\s+$/, "").split("\n");
  const indent = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
  return lines.map(l => l.slice(indent)).join("\n");
}

function buildDoc(mode, code) {
  const head = `<meta charset="utf-8"><style>${BASE_CSS}</style>
    <script src="vendor/d3.v7.min.js"><\/script><script src="data/skubal.js"><\/script>
    ${HELPERS ? '<script src="helpers.js"><\/script>' : ""}
    <script>${CONSOLE_SHIM}${CSV_SHIM}<\/script>`;
  const body = mode === "html" ? code : `<script>\n${code}\n<\/script>`;
  return `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
}

// Pages with <body data-vision> get a "View as" menu on every example. It filters the
// output frame through a simulation of color vision deficiency (Machado, Oliveira and
// Fernandes 2009, severity 1), applied in linear RGB, which is the SVG filter default.
const VISION = document.body.hasAttribute("data-vision");
const CVD = {
  protanopia:   [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deuteranopia: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.011820, 0.042940, 0.968881],
  tritanopia:   [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.303900],
};
const VISION_SELECT = `<label class="vision-label">View as <select class="vision">
    <option value="">normal color vision</option>
    ${Object.keys(CVD).map(k => `<option value="url(#cvd-${k})">${k}</option>`).join("")}
    <option value="grayscale(1)">grayscale</option></select></label>`;
if (VISION) {
  const m = v => [v[0], v[1], v[2], 0, 0, v[3], v[4], v[5], 0, 0, v[6], v[7], v[8], 0, 0, 0, 0, 0, 1, 0].join(" ");
  document.body.insertAdjacentHTML("afterbegin", `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
    ${Object.entries(CVD).map(([k, v]) => `<filter id="cvd-${k}"><feColorMatrix type="matrix" values="${m(v)}"/></filter>`).join("")}</svg>`);
}

// Edits are kept in this browser's localStorage, keyed by page and example title, together
// with the original code: if an example's original code changes, the stale edit is dropped.
// Storage can be unavailable (private windows, blocked site data), so every access is guarded.
const PAGE = location.pathname.split("/").pop() || "index.html";
const store = {
  get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} },
  remove(key) { try { localStorage.removeItem(key); } catch {} }
};

// Copies text to the clipboard and briefly confirms on the button.
async function copyText(button, text) {
  const label = button.textContent;
  try { await navigator.clipboard.writeText(text); button.textContent = "Copied"; }
  catch { button.textContent = "Copy failed"; }
  setTimeout(() => { button.textContent = label; }, 1200);
}

// Screen readers see an SVG as a pile of shapes. Any SVG in the output that has not been
// labeled by the example itself (helpers.js labels its charts) is marked as one image,
// named after the example.
function labelOutput(doc, title) {
  doc.querySelectorAll("svg:not([role])").forEach(svg => {
    if (svg.ownerSVGElement) return;                  // nested SVGs belong to their parent image
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", title.replace(/^[^·]*·\s*/, ""));
  });
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
      <button class="copy" aria-label="Copy ${title} code">Copy</button>
      ${VISION ? VISION_SELECT : ""}
      <span class="saved" hidden>edited · saved in this browser</span>
      <span class="hint">Edit, then Run or press ⌘/Ctrl + Enter</span></div>
    <iframe title="${title} output" style="height:${height}px"></iframe>`;

  const ta = figure.querySelector("textarea");
  const frame = figure.querySelector("iframe");
  const saved = figure.querySelector(".saved");
  const key = `d3-tutorial:${PAGE}:${title}`;
  const edit = store.get(key);
  ta.value = edit && edit.original === original ? edit.code : original;
  if (ta.value === original && edit) store.remove(key);
  saved.hidden = ta.value === original;
  ta.rows = Math.min(30, original.split("\n").length + 1);

  let timer;
  ta.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (ta.value === original) store.remove(key); else store.set(key, {original, code: ta.value});
      saved.hidden = ta.value === original;
    }, 400);
  });

  const run = () => { frame.srcdoc = buildDoc(mode, ta.value); };
  // Grow the frame to fit its output (checked a few times, since some examples load data asynchronously).
  const fit = () => {
    const doc = frame.contentDocument;
    if (!doc || !doc.body) return;
    frame.style.height = Math.max(height, doc.body.scrollHeight + 24) + "px";
    labelOutput(doc, title);
  };
  frame.addEventListener("load", () => [50, 300, 1000, 2500].forEach(t => setTimeout(fit, t)));
  figure.querySelector(".run").addEventListener("click", run);
  figure.querySelector("select.vision")?.addEventListener("change", e => {
    frame.style.filter = e.target.value;
  });
  figure.querySelector(".reset").addEventListener("click", () => {
    clearTimeout(timer);
    ta.value = original;
    store.remove(key);
    saved.hidden = true;
    run();
  });
  figure.querySelector(".copy").addEventListener("click", e => copyText(e.currentTarget, ta.value));
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

// <pre data-helpers> shows the source of the functions in helpers.js.
document.querySelectorAll("pre[data-helpers]").forEach(pre => {
  pre.textContent = pre.dataset.helpers.split(" ").map(name => String(window[name])).join("\n\n");
  const button = document.createElement("button");
  button.className = "copy-pre";
  button.textContent = "Copy";
  button.addEventListener("click", () => copyText(button, pre.textContent));
  pre.before(button);
});

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
