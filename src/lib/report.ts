export type ReportScan = {
  id: string;
  created_at: string;
  condition_name: string;
  condition_summary: string | null;
  stage: string | null;
  risk_level: string;
  risk_percentage: number;
  confidence: number | null;
  environmental_impact: string | null;
  causes: unknown;
  care_advice: unknown;
  urgency: string | null;
  env_uv_index: number | null;
  env_aqi: number | null;
  env_temperature: number | null;
  env_wind_speed: number | null;
  env_humidity: number | null;
  location_label: string | null;
};

export type ReportExtras = {
  /** Optional translator so the PDF matches the language shown on screen. */
  t?: (text: string) => string;
  patientName?: string | null;
  /** Optional progress summary line, e.g. "First 42% → latest 28% (improving)". */
  progressSummary?: string | null;
};

function list(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function esc(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildReportHtml(scan: ReportScan, extras: ReportExtras = {}) {
  const t = extras.t ?? ((text: string) => text);
  const causes = list(scan.causes);
  const advice = list(scan.care_advice);
  const generated = new Date(scan.created_at).toLocaleString();

  const row = (label: string, value: string | number | null | undefined) =>
    `<tr><th>${esc(t(label))}</th><td>${esc(value)}</td></tr>`;

  const bullets = (items: string[]) =>
    items.length
      ? `<ul>${items.map((item) => `<li>${esc(t(item))}</li>`).join("")}</ul>`
      : `<p class="muted">—</p>`;

  const envCell = (label: string, value: number | null, unit: string) =>
    `<div class="env"><span>${esc(t(label))}</span><strong>${
      value === null ? "—" : `${value}${unit ? ` ${unit}` : ""}`
    }</strong></div>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>${esc(t("EcoDerm AI skin screening report"))} — ${esc(scan.id.slice(0, 8))}</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: "DM Sans", "Segoe UI", Arial, sans-serif; color: #14201b; margin: 0; font-size: 11pt; line-height: 1.5; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1c7a5a; padding-bottom: 10px; }
  h1 { font-size: 19pt; margin: 0; color: #12604a; }
  h2 { font-size: 12pt; margin: 18px 0 6px; color: #12604a; text-transform: uppercase; letter-spacing: .05em; }
  .sub { font-size: 9.5pt; color: #5b6b64; margin-top: 3px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th, td { text-align: left; padding: 5px 8px; border-bottom: 1px solid #dfe8e3; vertical-align: top; }
  th { width: 40%; font-weight: 600; color: #37483f; background: #f3f8f5; }
  .risk { display: inline-block; padding: 3px 10px; border-radius: 999px; font-weight: 700; font-size: 10pt; border: 1px solid; }
  .low { color: #157a48; border-color: #157a48; background: #eaf7f0; }
  .medium { color: #a06a00; border-color: #a06a00; background: #fdf5e6; }
  .high { color: #b3261e; border-color: #b3261e; background: #fdecea; }
  .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
  .env { border: 1px solid #dfe8e3; border-radius: 6px; padding: 7px; text-align: center; }
  .env span { display: block; font-size: 8pt; text-transform: uppercase; color: #5b6b64; }
  .env strong { font-size: 12pt; }
  ul { margin: 4px 0 0; padding-left: 18px; }
  li { margin-bottom: 3px; }
  .box { border: 1px solid #cfe3d8; background: #f4faf6; border-radius: 6px; padding: 9px 11px; }
  .muted { color: #5b6b64; }
  footer { margin-top: 18px; border-top: 1px solid #dfe8e3; padding-top: 8px; font-size: 8.5pt; color: #5b6b64; }
</style></head>
<body>
<header>
  <div>
    <h1>EcoDerm AI</h1>
    <div class="sub">${esc(t("Environmental skin screening report"))}</div>
  </div>
  <div class="sub" style="text-align:right">
    <div><strong>${esc(t("Report ID"))}:</strong> ${esc(scan.id.slice(0, 8).toUpperCase())}</div>
    <div><strong>${esc(t("Generated"))}:</strong> ${esc(generated)}</div>
  </div>
</header>

<h2>${esc(t("Patient & scan information"))}</h2>
<table>
  ${row("Name", extras.patientName ?? t("Not provided"))}
  ${row("Scan date", generated)}
  ${row("Location", scan.location_label)}
</table>

<h2>${esc(t("Skin screening result"))}</h2>
<table>
  ${row("Condition", t(scan.condition_name))}
  ${row("Stage", scan.stage ? t(scan.stage) : null)}
  <tr><th>${esc(t("Risk level"))}</th><td><span class="risk ${esc(scan.risk_level)}">${esc(
    t(scan.risk_level).toUpperCase(),
  )}</span></td></tr>
  ${row("Risk percentage", `${scan.risk_percentage}%`)}
  ${row("AI confidence", scan.confidence === null ? null : `${scan.confidence}%`)}
</table>
${scan.condition_summary ? `<p>${esc(t(scan.condition_summary))}</p>` : ""}

<h2>${esc(t("Environmental factors at scan time"))}</h2>
<div class="grid">
  ${envCell("UV index", scan.env_uv_index, "")}
  ${envCell("Air quality", scan.env_aqi, "AQI")}
  ${envCell("Temperature", scan.env_temperature, "°C")}
  ${envCell("Wind speed", scan.env_wind_speed, "km/h")}
  ${envCell("Humidity", scan.env_humidity, "%")}
</div>
${
  scan.environmental_impact
    ? `<p class="box" style="margin-top:8px">${esc(t(scan.environmental_impact))}</p>`
    : ""
}

<h2>${esc(t("Likely causes"))}</h2>
${bullets(causes)}

<h2>${esc(t("Care guidance"))}</h2>
${bullets(advice)}

${
  extras.progressSummary
    ? `<h2>${esc(t("Progress summary"))}</h2><p class="box">${esc(extras.progressSummary)}</p>`
    : ""
}

<h2>${esc(t("Professional guidance"))}</h2>
<p>${esc(
    scan.urgency
      ? t(scan.urgency)
      : t("Consult a dermatologist if the area changes, spreads or becomes painful."),
  )}</p>

<footer>
  <strong>${esc(t("Medical disclaimer"))}:</strong>
  ${esc(
    t(
      "EcoDerm AI is an educational screening tool that combines photo analysis with live environmental data. It does not provide a medical diagnosis and must not replace examination by a qualified dermatologist.",
    ),
  )}
</footer>
<script>window.onload = function () { window.focus(); window.print(); };</script>
</body></html>`;
}

/** Opens a print-ready A4 report; the browser print dialog saves it as PDF. */
export function downloadReport(scan: ReportScan, extras: ReportExtras = {}) {
  const html = buildReportHtml(scan, extras);
  const win = window.open("", "_blank", "width=900,height=1200");
  if (win) {
    win.document.write(html);
    win.document.close();
    return;
  }
  // Popup blocked (common in Android WebView): fall back to a downloadable file.
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `ecoderm-report-${scan.id.slice(0, 8)}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}
