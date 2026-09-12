export type ProgressScan = {
  id: string;
  created_at: string;
  condition_name: string;
  risk_level: string;
  risk_percentage: number;
  stage: string | null;
};

export type ProgressTrend = "improving" | "stable" | "increased";

export type ConditionProgress = {
  condition: string;
  scans: ProgressScan[];
  points: { date: string; label: string; risk: number }[];
  firstRisk: number;
  latestRisk: number;
  change: number;
  trend: ProgressTrend;
  latestLevel: string;
};

export const TREND_LABEL: Record<ProgressTrend, string> = {
  improving: "Improving",
  stable: "Stable",
  increased: "Increased risk",
};

/** Groups scans by condition name and computes date-wise risk history per condition. */
export function buildProgress(scans: ProgressScan[]): ConditionProgress[] {
  const groups = new Map<string, ProgressScan[]>();

  for (const scan of scans) {
    const key = scan.condition_name.trim().toLowerCase();
    const bucket = groups.get(key);
    if (bucket) bucket.push(scan);
    else groups.set(key, [scan]);
  }

  const result: ConditionProgress[] = [];

  for (const bucket of groups.values()) {
    const ordered = [...bucket].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const first = ordered[0]!;
    const latest = ordered[ordered.length - 1]!;
    const change = latest.risk_percentage - first.risk_percentage;
    const trend: ProgressTrend = change <= -5 ? "improving" : change >= 5 ? "increased" : "stable";

    result.push({
      condition: latest.condition_name,
      scans: [...ordered].reverse(),
      points: ordered.map((scan) => ({
        date: scan.created_at,
        label: new Date(scan.created_at).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
        }),
        risk: scan.risk_percentage,
      })),
      firstRisk: first.risk_percentage,
      latestRisk: latest.risk_percentage,
      change,
      trend,
      latestLevel: latest.risk_level,
    });
  }

  return result.sort(
    (a, b) =>
      new Date(b.scans[0]!.created_at).getTime() - new Date(a.scans[0]!.created_at).getTime(),
  );
}

/** One-line summary used inside the PDF report. */
export function progressSummaryFor(
  entry: ConditionProgress | undefined,
  t: (text: string) => string,
): string | null {
  if (!entry || entry.scans.length < 2) return null;
  const direction = t(TREND_LABEL[entry.trend]);
  return `${t(entry.condition)}: ${entry.scans.length} ${t("scans")} · ${t("first")} ${
    entry.firstRisk
  }% → ${t("latest")} ${entry.latestRisk}% (${entry.change > 0 ? "+" : ""}${
    entry.change
  }%, ${direction})`;
}
