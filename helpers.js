// Helpers preloaded in every example, after D3 and the pitch data.
// Section 2 of index.html prints this code on the page, so keep it short and readable.

// One color per pitch type, in a fixed order, used on both pages.
const pitchTypes = ["4-Seam Fastball", "Changeup", "Sinker", "Slider", "Curveball"];
const pitchColor = d3.scaleOrdinal(pitchTypes, ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"]);

// Where new elements go: a CSS selector, a DOM node, or a D3 selection.
function place(parent) {
  return typeof parent === "string" || parent instanceof Node ? d3.select(parent) : parent;
}

// A flex row, for putting several small charts side by side.
function row(parent = "body") {
  return place(parent).append("div").style("display", "flex").style("flex-wrap", "wrap").style("gap", "4px 16px");
}

// An SVG with margins, axes, axis labels and a title. Pass scales with a domain;
// chart() sets their ranges. Returns {svg, x, y, width, height, margin}.
// For screen readers the SVG is one image, named by `description` if given, or else by
// its title and axis labels.
function chart({x, y, width = 460, height = 300, margin = {}, title, xLabel, yLabel, description,
                xTicks = 6, yTicks = 6, xFormat, yFormat, grid = false, parent = "body"} = {}) {
  const m = {top: title ? 26 : 10, right: 16, bottom: xLabel ? 42 : 26, left: yLabel ? 58 : 44, ...margin};
  const svg = place(parent).append("svg").attr("width", width).attr("height", height)
    .attr("font-family", "sans-serif").attr("font-size", 11);
  const label = description || [title, xLabel && `horizontal axis: ${xLabel}`, yLabel && `vertical axis: ${yLabel}`]
    .filter(Boolean).join(". ");
  if (label) svg.attr("role", "img").attr("aria-label", label);
  if (title) svg.append("text").attr("x", m.left).attr("y", 15).attr("font-weight", 600).attr("font-size", 12).text(title);

  if (x) {
    x.range([m.left, width - m.right]);
    const axis = d3.axisBottom(x).tickSizeOuter(0);
    if (!x.bandwidth) axis.ticks(xTicks, xFormat); else if (xFormat) axis.tickFormat(xFormat);
    svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height - m.bottom})`).call(axis);
    if (grid && !x.bandwidth) svg.append("g").attr("stroke", "#000").attr("stroke-opacity", 0.07)
      .selectAll("line").data(x.ticks(xTicks)).join("line")
      .attr("x1", d => x(d)).attr("x2", d => x(d)).attr("y1", m.top).attr("y2", height - m.bottom);
    if (xLabel) svg.append("text").attr("x", (m.left + width - m.right) / 2).attr("y", height - 6)
      .attr("text-anchor", "middle").attr("fill", "#4c4b46").text(xLabel);
  }
  if (y) {
    y.range(y.bandwidth ? [m.top, height - m.bottom] : [height - m.bottom, m.top]);
    const axis = d3.axisLeft(y).tickSizeOuter(0);
    if (!y.bandwidth) axis.ticks(yTicks, yFormat); else if (yFormat) axis.tickFormat(yFormat);
    svg.append("g").attr("class", "y-axis").attr("transform", `translate(${m.left},0)`).call(axis);
    if (grid && !y.bandwidth) svg.append("g").attr("stroke", "#000").attr("stroke-opacity", 0.07)
      .selectAll("line").data(y.ticks(yTicks)).join("line")
      .attr("x1", m.left).attr("x2", width - m.right).attr("y1", d => y(d)).attr("y2", d => y(d));
    if (yLabel) svg.append("text").attr("transform", `translate(14,${(m.top + height - m.bottom) / 2}) rotate(-90)`)
      .attr("text-anchor", "middle").attr("fill", "#4c4b46").text(yLabel);
  }
  return {svg, x, y, width, height, margin: m};
}

// A legend for a categorical (ordinal) color scale: one swatch per domain value.
function swatches(color, {title, parent = "body"} = {}) {
  const div = place(parent).append("div").style("font", "11px sans-serif").style("margin", "4px 0 8px")
    .style("display", "flex").style("flex-wrap", "wrap").style("gap", "2px 14px").style("align-items", "center");
  div.attr("role", "list").attr("aria-label", title || "Color legend");
  if (title) div.append("span").attr("aria-hidden", "true").style("font-weight", 600).text(title);
  const item = div.selectAll("span.swatch").data(color.domain()).join("span").attr("class", "swatch").attr("role", "listitem");
  item.append("span").style("display", "inline-block").style("width", "12px").style("height", "12px")
    .style("margin-right", "5px").style("vertical-align", "-2px").style("border-radius", "2px")
    .style("background", d => color(d));
  item.append("span").text(d => d);
  return div;
}

// A legend for a continuous or binned color scale: a strip of color with ticks.
// Handles scaleSequential, scaleDiverging, scaleQuantize, scaleQuantile and scaleThreshold.
function ramp(color, {title, width = 300, ticks = 5, tickFormat, parent = "body"} = {}) {
  const height = 46, m = {left: 12, right: 12, top: 16, bottom: 18};
  const svg = place(parent).append("svg").attr("width", width).attr("height", height)
    .attr("font-family", "sans-serif").attr("font-size", 10).style("display", "block");
  if (title) svg.append("text").attr("x", m.left).attr("y", 11).attr("font-weight", 600).text(title);
  let x, axis;
  if (color.interpolator) {                         // continuous: sample the scale at every pixel
    const domain = color.domain();
    x = d3.scaleLinear(domain, d3.quantize(d3.interpolate(m.left, width - m.right), domain.length));
    svg.append("g").selectAll("rect").data(d3.range(m.left, width - m.right)).join("rect")
      .attr("x", d => d).attr("y", m.top).attr("width", 1.5).attr("height", height - m.top - m.bottom)
      .attr("fill", d => color(x.invert(d)));
    axis = d3.axisBottom(x).ticks(ticks, tickFormat);
  } else {                                          // binned: one box per color, labels at the breaks
    const breaks = color.thresholds ? color.thresholds() : color.quantiles ? color.quantiles() : color.domain();
    const colors = color.range();
    x = d3.scaleLinear([-1, colors.length - 1], [m.left, width - m.right]);
    svg.append("g").selectAll("rect").data(colors).join("rect")
      .attr("x", (d, i) => x(i - 1)).attr("y", m.top).attr("width", (d, i) => x(i) - x(i - 1))
      .attr("height", height - m.top - m.bottom).attr("fill", d => d);
    const format = typeof tickFormat === "function" ? tickFormat : d3.format(tickFormat || ",.3~r");
    axis = d3.axisBottom(x).tickValues(d3.range(breaks.length)).tickFormat(i => format(breaks[i]));
  }
  svg.append("g").attr("transform", `translate(0,${height - m.bottom})`)
    .call(axis.tickSize(4)).call(g => g.select(".domain").remove());
  const range = color.interpolator ? `from ${d3.min(color.domain())} to ${d3.max(color.domain())}`
    : `${color.range().length} classes`;
  svg.attr("role", "img").attr("aria-label", `Color legend${title ? `, ${title}` : ""}: ${range}`);
  return svg;
}

// Hover tooltips: tooltip(marks, d => "text") shows the text next to the mouse.
function tooltip(marks, html) {
  const tip = d3.select("body").selectAll("div.tooltip").data([0]).join("div").attr("class", "tooltip")
    .style("display", "none");
  marks.on("mouseenter", (event, d) => tip.style("display", "block").html(html(d)))
    .on("mousemove", event => tip.style("left", event.pageX + 12 + "px").style("top", event.pageY + 12 + "px"))
    .on("mouseleave", () => tip.style("display", "none"));
  return marks;
}

// The rule-book strike zone, catcher's view, in feet: the plate is 17 inches wide, and a pitch
// is a strike if any part of the ball (about 1.5 inches in radius) crosses the zone.
// Top and bottom are the averages of the per-batter values in the data.
const zone = {left: -0.83, right: 0.83, bottom: d3.mean(pitches, d => d.sz_bot), top: d3.mean(pitches, d => d.sz_top)};

// Drawn twice, white under black, so the outline stays visible on dark and light fills.
function strikeZone({svg, x, y}) {
  const g = svg.append("g").attr("fill", "none");
  for (const [stroke, width] of [["#fff", 4], ["#1d1d1b", 1.5]]) {
    g.append("rect").attr("x", x(zone.left)).attr("y", y(zone.top))
      .attr("width", x(zone.right) - x(zone.left)).attr("height", y(zone.bottom) - y(zone.top))
      .attr("stroke", stroke).attr("stroke-width", width);
  }
  return g;
}

// Bins pitches by where they crossed the plate into square cells of the given size in feet,
// covering plate_x from -2 to 2 and plate_z from 0 to 5. Returns one object per cell,
// {x0, x1, z0, z1, rows}, where rows holds the pitches in the cell. Pitches outside are dropped.
function locationBins(rows, size = 0.5) {
  const nx = Math.round(4 / size), nz = Math.round(5 / size);
  const cells = d3.cross(d3.range(nx), d3.range(nz), (i, j) =>
    ({x0: -2 + i * size, x1: -2 + (i + 1) * size, z0: j * size, z1: (j + 1) * size, rows: []}));
  for (const d of rows) {
    const i = Math.floor((d.plate_x + 2) / size), j = Math.floor(d.plate_z / size);
    if (i >= 0 && i < nx && j >= 0 && j < nz) cells[i * nz + j].rows.push(d);
  }
  return cells;
}

// How a color looks with a color vision deficiency: kind is "protanopia", "deuteranopia" or
// "tritanopia". The matrices are from Machado, Oliveira and Fernandes (2009), severity 1, and
// apply to linear RGB, so the color is converted from sRGB and back. Returns a hex string.
// (tutorial.js uses the same matrices for the "View as" menu.)
function cvd(color, kind) {
  const M = {
    protanopia:   [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
    deuteranopia: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.011820, 0.042940, 0.968881],
    tritanopia:   [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.303900],
  }[kind];
  const toLinear = v => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  const toSRGB = v => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
  const {r, g, b} = d3.rgb(color);
  const [R, G, B] = [r, g, b].map(toLinear);
  const channel = i => toSRGB(Math.min(1, Math.max(0, M[i] * R + M[i + 1] * G + M[i + 2] * B)));
  return d3.rgb(channel(0), channel(3), channel(6)).formatHex();
}
