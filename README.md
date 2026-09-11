# A minimal D3 tutorial

A single-page, self-contained D3 tutorial for InfoVis and VisML students: just
enough HTML, CSS, JavaScript and SVG, then the part of D3 that does most of the
work, ending with a brushed, linked view. Every example on the page is editable
and runs in place.

The running example is 495 pitches by Tarik Skubal.

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

Open `index.html` in a browser. That is enough: D3 is vendored and the data is
embedded, so the page works from a `file://` URL.

To try `d3.csv` against the real file (section 6), serve the directory:

```sh
python3 -m http.server 8000
```

and open http://localhost:8000.

## Layout

| File | Purpose |
|---|---|
| `index.html` | The tutorial. Prose and all example code live here. |
| `tutorial.css` | Page styles. |
| `tutorial.js` | Turns each `<figure class="example">` into an editor, a Run button and an output frame. |
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

The one thing the code cannot contain is the literal string `</script>`.

## Checking the page

There is no test suite. `index.html` was verified by running all 26 examples in
headless Chrome and confirming that none raised an error and that each produced
the expected elements. Repeat that after editing by opening the page and
scrolling through it; an error in any example prints in red under its output.

## Acknowledgments and license

The structure of the tutorial follows Scott Murray's
[D3 tutorials](https://scottmurray.org/tutorials/d3) (2012), which inspired it.
The text and code here are new.

Copyright © 2026 Claudio T. Silva. The prose is licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); the code (the examples
in `index.html`, `tutorial.js`, `tutorial.css`, `data/make_data.py`) under the MIT
License. See `LICENSE`. D3 is vendored under its ISC license (`vendor/D3-LICENSE`).
The pitch data is covered by neither license; see the data acknowledgment above.
