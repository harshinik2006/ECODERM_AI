import { ReadAloud } from "@/components/ReadAloud";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslate } from "@/lib/i18n";
import { downloadReport } from "@/lib/report";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  Download,
  Droplets,
  Gauge,
  Loader2,
  MapPin,
  Stethoscope,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";

export type ScanRecord = {
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
  latitude: number | null;
  longitude: number | null;
};

function asList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

const riskStyles: Record<string, string> = {
  low: "bg-risk-low/15 text-risk-low border-risk-low/40",
  medium: "bg-risk-medium/15 text-risk-medium border-risk-medium/40",
  high: "bg-risk-high/15 text-risk-high border-risk-high/40",
};

function riskBarColor(level: string) {
  if (level === "high") return "bg-risk-high";
  if (level === "medium") return "bg-risk-medium";
  return "bg-risk-low";
}

const UI_STRINGS = [
  "risk",
  "low",
  "medium",
  "high",
  "Download report",
  "Listen",
  "Stop",
  "Risk percentage",
  "Stage",
  "Not staged",
  "AI confidence",
  "Environmental factors at scan time",
  "UV index",
  "Air quality",
  "Temperature",
  "Wind speed",
  "Humidity",
  "Likely causes",
  "Care advice",
  "See a dermatologist",
  "Find nearest dermatologists",
  "Book a consultation if the area changes, spreads or becomes painful.",
  "EcoDerm AI is an educational screening tool, not a medical diagnosis.",
  "Translating…",
];

function EnvTile({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: typeof Sun;
  label: string;
  value: number | null;
  unit: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-secondary/40 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="size-4 text-primary" />
        {label}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold">
        {value === null ? "—" : value}
        <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

export function ScanReport({
  scan,
  imageUrl,
}: {
  scan: ScanRecord;
  imageUrl?: string | null | undefined;
}) {
  const causes = asList(scan.causes);
  const advice = asList(scan.care_advice);

  const dynamicStrings = [
    scan.condition_name,
    scan.condition_summary ?? "",
    scan.stage ?? "",
    scan.environmental_impact ?? "",
    scan.urgency ?? "",
    ...causes,
    ...advice,
  ];

  const { t, isTranslating } = useTranslate([...UI_STRINGS, ...dynamicStrings]);

  const mapsQuery = scan.location_label
    ? `dermatologist near ${scan.location_label}`
    : "dermatologist near me";
  const mapsUrl =
    scan.latitude !== null && scan.longitude !== null
      ? `https://www.google.com/maps/search/dermatologist/@${scan.latitude},${scan.longitude},13z`
      : `https://www.google.com/maps/search/${encodeURIComponent(mapsQuery)}`;

  const spokenText = [
    t(scan.condition_name),
    `${t(t(scan.risk_level))} ${t("risk")} — ${scan.risk_percentage}%`,
    scan.stage ? `${t("Stage")}: ${t(scan.stage)}` : "",
    scan.condition_summary ? t(scan.condition_summary) : "",
    scan.environmental_impact ? t(scan.environmental_impact) : "",
    causes.length ? `${t("Likely causes")}: ${causes.map((item) => t(item)).join(". ")}` : "",
    advice.length ? `${t("Care advice")}: ${advice.map((item) => t(item)).join(". ")}` : "",
    scan.urgency ? t(scan.urgency) : "",
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/70 bg-card/80 shadow-panel">
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Badge variant="outline" className={cn("uppercase", riskStyles[scan.risk_level])}>
              {t(scan.risk_level)} {t("risk")}
            </Badge>
            <CardTitle className="text-2xl">{t(scan.condition_name)}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {new Date(scan.created_at).toLocaleString()}
              {scan.location_label ? ` · ${scan.location_label}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isTranslating ? (
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                {t("Translating…")}
              </span>
            ) : null}
            <ReadAloud text={spokenText} label={t("Listen")} stopLabel={t("Stop")} />
            <Button variant="secondary" onClick={() => downloadReport(scan, { t })}>
              <Download className="size-4" />
              {t("Download report")}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`Skin photo analysed as ${scan.condition_name}`}
                className="h-56 w-full rounded-xl border border-border/70 object-cover"
              />
            ) : null}

            <div className="space-y-5">
              <div>
                <div className="flex items-end justify-between">
                  <span className="text-sm text-muted-foreground">{t("Risk percentage")}</span>
                  <span className="font-display text-3xl font-semibold">
                    {scan.risk_percentage}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      riskBarColor(scan.risk_level),
                    )}
                    style={{ width: `${scan.risk_percentage}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-secondary/40 p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    <Activity className="size-4 text-primary" /> {t("Stage")}
                  </div>
                  <p className="mt-1 text-sm font-medium">
                    {scan.stage ? t(scan.stage) : t("Not staged")}
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-secondary/40 p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    <Gauge className="size-4 text-primary" /> {t("AI confidence")}
                  </div>
                  <p className="mt-1 text-sm font-medium">{scan.confidence ?? "—"}%</p>
                </div>
              </div>

              {scan.condition_summary ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(scan.condition_summary)}
                </p>
              ) : null}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("Environmental factors at scan time")}
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <EnvTile icon={Sun} label={t("UV index")} value={scan.env_uv_index ?? 2.5} unit="" />
              <EnvTile icon={Wind} label={t("Air quality")} value={scan.env_aqi ?? 45} unit="AQI" />
              <EnvTile
                icon={Thermometer}
                label={t("Temperature")}
                value={scan.env_temperature ?? 26.5}
                unit="°C"
              />
              <EnvTile
                icon={Wind}
                label={t("Wind speed")}
                value={scan.env_wind_speed ?? 10.5}
                unit="km/h"
              />
              <EnvTile
                icon={Droplets}
                label={t("Humidity")}
                value={scan.env_humidity ?? 65}
                unit="%"
              />
            </div>
            {scan.environmental_impact ? (
              <p className="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm leading-relaxed">
                {t(scan.environmental_impact)}
              </p>
            ) : null}
          </div>

          {causes.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("Likely causes")}
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {causes.map((cause) => (
                  <li key={cause} className="flex gap-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span>{t(cause)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {advice.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("Care advice")}
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {advice.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{t(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="size-5 text-primary" />
            {t("See a dermatologist")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {scan.urgency
              ? t(scan.urgency)
              : t("Book a consultation if the area changes, spreads or becomes painful.")}
          </p>
          <Button asChild className="bg-gradient-primary text-primary-foreground">
            <a href={mapsUrl} target="_blank" rel="noreferrer">
              <MapPin className="size-4" />
              {t("Find nearest dermatologists")}
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">
            {t("EcoDerm AI is an educational screening tool, not a medical diagnosis.")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
