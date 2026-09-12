import { ScanRecord } from "@/components/ScanReport";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useTranslate } from "@/lib/i18n";
import { TREND_LABEL, buildProgress, type ProgressTrend } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  LineChart as LineChartIcon,
  Loader2,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Skin condition progress — EcoDerm AI" },
      {
        name: "description",
        content:
          "Track how each skin condition changes over time with date-wise risk history and trend graphs.",
      },
      { property: "og:title", content: "Skin condition progress — EcoDerm AI" },
      {
        property: "og:description",
        content: "Risk trend graphs per skin condition, first vs latest risk and change over time.",
      },
    ],
  }),
  component: ProgressPage,
});

const UI = [
  "Progress tracking",
  "How each skin condition has changed across your scans.",
  "New scan",
  "Back to history",
  "No progress data yet",
  "Scan the same area more than once and we'll chart how the risk changes over time.",
  "Start a scan",
  "scans",
  "scan",
  "First risk",
  "Latest risk",
  "Risk change",
  "Risk trend",
  "Improving",
  "Stable",
  "Increased risk",
  "Only one scan so far — scan again later to see a trend.",
  "Risk %",
  "View report",
  "risk",
];

const trendStyles: Record<ProgressTrend, string> = {
  improving: "bg-risk-low/15 text-risk-low border-risk-low/40",
  stable: "bg-risk-medium/15 text-risk-medium border-risk-medium/40",
  increased: "bg-risk-high/15 text-risk-high border-risk-high/40",
};

const TrendIcon = { improving: ArrowDownRight, stable: ArrowRight, increased: ArrowUpRight };

function ProgressPage() {
  const { user } = useAuth();

  const scansQuery = useQuery({
    queryKey: ["scans", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      let remoteScans: ScanRecord[] = [];
      try {
        const { data, error } = await supabase
          .from("scans")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) remoteScans = data as unknown as ScanRecord[];
      } catch (err) {
        console.warn("Could not fetch remote scans:", err);
      }

      let localScans: ScanRecord[] = [];
      try {
        const stored = localStorage.getItem("ecoderm_local_scans");
        if (stored) localScans = JSON.parse(stored) as ScanRecord[];
      } catch (err) {
        console.warn("Could not parse local scans:", err);
      }

      const combined = [...remoteScans];
      for (const local of localScans) {
        if (!combined.some((s) => s.id === local.id)) {
          combined.push(local);
        }
      }
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return combined;
    },
  });

  const groups = buildProgress(scansQuery.data ?? []);
  const { t } = useTranslate([...UI, ...groups.map((group) => group.condition)]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">
            {t("Progress tracking")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("How each skin condition has changed across your scans.")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link to="/history">{t("Back to history")}</Link>
          </Button>
          <Button asChild size="sm" className="bg-gradient-primary text-primary-foreground">
            <Link to="/scan">{t("New scan")}</Link>
          </Button>
        </div>
      </div>

      {scansQuery.isLoading ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : groups.length === 0 ? (
        <Card className="mt-8 border-dashed border-border bg-secondary/30">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <LineChartIcon className="size-8 text-muted-foreground" />
            <p className="font-medium">{t("No progress data yet")}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t(
                "Scan the same area more than once and we'll chart how the risk changes over time.",
              )}
            </p>
            <Button asChild variant="secondary">
              <Link to="/scan">{t("Start a scan")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 space-y-6">
          {groups.map((group) => {
            const Icon = TrendIcon[group.trend];
            return (
              <Card key={group.condition} className="border-border/70 bg-card/80 shadow-panel">
                <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg sm:text-xl">{t(group.condition)}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {group.scans.length} {t(group.scans.length === 1 ? "scan" : "scans")} ·{" "}
                      {new Date(
                        group.scans[group.scans.length - 1]!.created_at,
                      ).toLocaleDateString()}{" "}
                      → {new Date(group.scans[0]!.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn("gap-1", trendStyles[group.trend])}>
                    <Icon className="size-3.5" />
                    {t(TREND_LABEL[group.trend])}
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "First risk", value: `${group.firstRisk}%` },
                      { label: "Latest risk", value: `${group.latestRisk}%` },
                      {
                        label: "Risk change",
                        value: `${group.change > 0 ? "+" : ""}${group.change}%`,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-border/70 bg-secondary/40 p-4"
                      >
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {t(item.label)}
                        </p>
                        <p className="mt-1 font-display text-2xl font-semibold">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {group.points.length > 1 ? (
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                        {t("Risk trend")}
                      </p>
                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={group.points}
                            margin={{ top: 8, right: 12, bottom: 0, left: -18 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis
                              dataKey="label"
                              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            />
                            <YAxis
                              domain={[0, 100]}
                              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            />
                            <Tooltip
                              contentStyle={{
                                background: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: 12,
                                fontSize: 12,
                              }}
                              formatter={(value) => [`${value}%`, t("Risk %")]}
                            />
                            <Line
                              type="monotone"
                              dataKey="risk"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2.5}
                              dot={{ r: 4, fill: "hsl(var(--primary))" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-xl border border-border/70 bg-secondary/30 p-4 text-sm text-muted-foreground">
                      {t("Only one scan so far — scan again later to see a trend.")}
                    </p>
                  )}

                  <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                    {group.scans.map((scan) => (
                      <li
                        key={scan.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                      >
                        <span className="text-muted-foreground">
                          {new Date(scan.created_at).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="font-medium">
                            {scan.risk_percentage}% {t(scan.risk_level)} {t("risk")}
                          </span>
                          <Button asChild variant="ghost" size="sm">
                            <Link to="/report/$id" params={{ id: scan.id }}>
                              {t("View report")}
                            </Link>
                          </Button>
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
