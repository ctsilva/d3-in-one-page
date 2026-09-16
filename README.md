# D3 in one page, and two labs on marks and color

Self-contained tutorials for InfoVis and VisML students. Every example on every page is
editable and runs in place.

| Page | What it covers | Time |
|---|---|---|
| `index.html`, **A minimal D3 tutorial** | Just enough HTML, CSS, JavaScript and SVG, then the part of D3 that does most of the work, ending with a brushed, linked view. | about 3 hours |
| `marks.html`, **Marks, channels and graphs** | Every exercise has a hidden discussion or worked solution. Data types; marks and channels; pitch type as symbols and redundant encoding; expressiveness and effectiveness; bar charts, dot plots, histograms, box and strip plots, lines, stacked areas, scatterplots, small multiples, symbol maps, matrices, location heatmaps and density; zero baselines, domains and shared scales; choosing a graph. | about 2.5 hours |
| `color.html`, **Color** | Color to label vs. to quantify; RGB, HSL, CIELAB and HCL; interpolation; categorical palettes, saliency and emphasis; sequential scales and lightness profiles; rainbow false edges; diverging scales and balanced domains; quantize, quantile and threshold scales; simultaneous contrast, mark size and text contrast; color vision deficiency; a "fix this chart" exercise. | about 2.5 hours |

The pages are meant to be read in that order. The two labs map onto the Week 3
(fundamental graphs), Week 4 (perception) and Week 5 (color) lectures of the NYU InfoVis
course. The running example throughout is 495 pitches by Tarik Skubal.

## Data acknowledgment

The pitch data comes from [Baseball Savant](https://baseballsavant.mlb.com),
Major League Baseball's Statcast site, and is copyright MLB Advanced Media, L.P.
It was downloaded on September 8, 2026 via Statcast search (pitcher Tarik
Skubal, MLB ID 669373, regular season, August 8 to September 7, 2026).
`data/skubal.csv` keeps 22 of the original 119 columns and is otherwise
unmodified. This excerpt is included for teaching and non-commercial
educational use; we claim no ownership of the data and do not redistribute the
full dataset. Download it from Baseball Savant for any other use. See
[Statcast field definitions](https://baseballsavant.mlb.com/csv-docs) for
column meanings and `data/README.md` for the exact download query.

## Running it

Open `index.html` (or `marks.html`, `color.html`) in a browser. That is enough: D3 is
vendored and the data is embedded, so the pages work from a `file://` URL.

To try `d3.csv` against the real file (section 6 of the D3 tutorial), serve the directory:

```sh
python3 -m http.server 8000
```

and open http://localhost:8000.

## Layout

| File | Purpose |
|---|---|
| `index.html` | The D3 tutorial. Prose and all example code live here. |
| `marks.html` | Lab 1: marks, channels and graphs. |
| `color.html` | Lab 2: color. |
| `tutorial.css` | Page styles, shared by all three pages. |
| `tutorial.js` | Turns each `<figure class="example">` into an editor, a Run button and an output frame. |
| `helpers.js` | Chart helpers for the two labs: `chart`, `row`, `swatches`, `ramp`, `tooltip`, `strikeZone`, `locationBins`, `cvd`, and the shared `pitchTypes` / `pitchColor`. Section 2 of `marks.html` prints its functions. |
| `data/skubal.csv` | 495 rows, 22 columns, trimmed from the Statcast export. |
| `data/skubal.js` | The same rows as `window.pitches`, plus the CSV text as `window.pitchesCSV`. |
| `data/make_data.py` | Regenerates both data files from a raw Statcast export (see `data/README.md`). |
| `LICENSE` | MIT for the code, CC BY 4.0 for the prose. |
| `vendor/d3.v7.min.js` | D3 7.9.0 (ISC license in `vendor/D3-LICENSE`). |

## Editing examples

An example is a figure with the code in a plain-text script block, so no HTML
escaping is needed:

```html
<figure class="example" data-mode="js" data-height="240" data-title="Example 6.2 · One circle per pitch">
<script type="text/plain">
  const svg = d3.select("body").append("svg") ...
</script>
</figure>
```

- `data-mode="js"` runs the text as a script with `d3` and `pitches` already
  loaded. `data-mode="html"` renders the text as the body of a page.
- `data-height` is the minimum output height in pixels; frames grow to fit.
- `console.log` output appears below the example. Errors are shown, not hidden.
- Each example runs in its own iframe when it scrolls into view.
- Edits are saved in the browser's `localStorage`, keyed by page and example title, so they
  survive a reload; the bar says "edited · saved in this browser". Reset restores the
  original and clears the saved copy. A saved edit is dropped if the example's original
  code has changed since it was saved.
- Copy puts the example's current code on the clipboard.
- For screen readers, every SVG in an example's output is exposed as one image
  (`role="img"`). `chart()` names it from its `description`, title and axis labels, and
  the legend helpers name theirs; any other SVG is named after the example's title.
- Exercise solutions go in `<details class="solution">` after the exercise. Solutions
  with code are ordinary example figures titled "Solution …", so they run and are
  checked like any other example.

The one thing the code cannot contain is the literal string `</script>`.

Two attributes on `<body>` change how a page's examples run:

- `data-helpers` loads `helpers.js` into every example. The labs set it; the D3 tutorial
  does not, so its examples write everything out and can use names like `chart` freely.
- `data-vision` adds a "View as" menu to every example that shows the output as it looks
  with protanopia, deuteranopia or tritanopia, or in grayscale. It applies an SVG
  `feColorMatrix` filter to the output frame, using the Machado, Oliveira and Fernandes
  (2009) matrices at severity 1; `cvd(color, kind)` in `helpers.js` uses the same matrices
  on single colors. It works in Chrome, Edge and Firefox; Safari may not apply it.
  `color.html` sets it.

Conventions in the labs:

- Pass scales to `chart()` with `.domain(...)` and let it set the range. The one-argument
  shorthand `d3.scaleLinear([0, 10])` sets the *range*, not the domain.
- Keep `pitchColor` meaning pitch type everywhere; use greys or another palette for other
  fields.
- Every number quoted in the prose (shares, rates, speeds, counts) was checked against
  the data; recheck the text if you change an example's data or scales.

## Checking the pages

There is no test suite. All three pages were verified by running every example in
headless Chrome (26 in the D3 tutorial, 34 in `marks.html` including 12 solutions, 20 in `color.html`) and
confirming that none raised an error and that each produced the expected elements; the
lab outputs were also inspected as screenshots, including with the deuteranopia filter.
Repeat that after editing by opening the page and scrolling through it; an error in any
example prints in red under its output.

## Acknowledgments and license

The structure of the D3 tutorial follows Scott Murray's
[D3 tutorials](https://scottmurray.org/tutorials/d3) (2012), which inspired it.
The treatment of marks and channels follows Mackinlay (1986), Cleveland and McGill (1984)
and Munzner (2014); the color lab's references are listed at the end of `color.html`.
The text and code here are new.

Copyright © 2026 Claudio T. Silva. The prose is licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); the code (the examples
in the three HTML pages, `helpers.js`, `tutorial.js`, `tutorial.css`, `data/make_data.py`)
under the MIT License. See `LICENSE`. D3 is vendored under its ISC license
(`vendor/D3-LICENSE`). The pitch data is covered by neither license; see the data
acknowledgment above.
