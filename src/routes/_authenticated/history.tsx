import { ScanRecord } from "@/components/ScanReport";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useTranslate } from "@/lib/i18n";
import { buildProgress, progressSummaryFor } from "@/lib/progress";
import { downloadReport } from "@/lib/report";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Download, FileText, LineChart, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Scan history — EcoDerm AI" },
      {
        name: "description",
        content: "Review, download or delete your previous EcoDerm AI skin screening reports.",
      },
      { property: "og:title", content: "Scan history — EcoDerm AI" },
      {
        property: "og:description",
        content: "All your past skin scans with risk levels and environmental context.",
      },
    ],
  }),
  component: HistoryPage,
});

const riskStyles: Record<string, string> = {
  low: "bg-risk-low/15 text-risk-low border-risk-low/40",
  medium: "bg-risk-medium/15 text-risk-medium border-risk-medium/40",
  high: "bg-risk-high/15 text-risk-high border-risk-high/40",
};

const UI = [
  "Scan history",
  "Every report you've generated, newest first.",
  "New scan",
  "Progress tracking",
  "No scans yet",
  "Upload your first skin photo to get a condition, stage, risk percentage and dermatologist recommendation.",
  "Start a scan",
  "View",
  "Download report",
  "Delete scan",
  "Scan deleted.",
  "Could not delete that scan.",
  "low",
  "medium",
  "high",
  "scans",
  "scan",
  "first",
  "latest",
  "Improving",
  "Stable",
  "Increased risk",
];

function HistoryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
        if (!error && data) {
          remoteScans = data as unknown as ScanRecord[];
        }
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

  const scans = scansQuery.data ?? [];
  const progress = buildProgress(scans);
  const { t } = useTranslate([...UI, ...scans.map((scan) => scan.condition_name)]);

  const remove = useMutation({
    mutationFn: async (scan: { id: string; image_path: string | null }) => {
      try {
        if (scan.image_path) {
          await supabase.storage.from("scan-images").remove([scan.image_path]);
        }
        await supabase.from("scans").delete().eq("id", scan.id);
      } catch (err) {
        console.warn("Remote delete warning:", err);
      }

      try {
        const stored = localStorage.getItem("ecoderm_local_scans");
        if (stored) {
          const list = JSON.parse(stored) as { id: string }[];
          const filtered = list.filter((s) => s.id !== scan.id);
          localStorage.setItem("ecoderm_local_scans", JSON.stringify(filtered));
        }
      } catch {
        // ignore
      }
    },
    onSuccess: () => {
      toast.success(t("Scan deleted."));
      void queryClient.invalidateQueries({ queryKey: ["scans", user?.id] });
    },
    onError: () => toast.error(t("Could not delete that scan.")),
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">{t("Scan history")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("Every report you've generated, newest first.")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link to="/progress">
              <LineChart className="size-4" />
              {t("Progress tracking")}
            </Link>
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
      ) : scans.length === 0 ? (
        <Card className="mt-8 border-dashed border-border bg-secondary/30">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <FileText className="size-8 text-muted-foreground" />
            <p className="font-medium">{t("No scans yet")}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t(
                "Upload your first skin photo to get a condition, stage, risk percentage and dermatologist recommendation.",
              )}
            </p>
            <Button asChild variant="secondary">
              <Link to="/scan">{t("Start a scan")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="mt-8 space-y-4">
          {scans.map((scan) => (
            <li key={scan.id}>
              <Card className="border-border/70 bg-card/80">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-base font-semibold sm:text-lg">
                        {t(scan.condition_name)}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn("uppercase", riskStyles[scan.risk_level])}
                      >
                        {t(scan.risk_level)} · {scan.risk_percentage}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(scan.created_at).toLocaleString()}
                      {scan.location_label ? ` · ${scan.location_label}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button asChild variant="secondary" size="sm">
                      <Link to="/report/$id" params={{ id: scan.id }}>
                        {t("View")}
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("Download report")}
                      onClick={() =>
                        downloadReport(scan, {
                          t,
                          progressSummary: progressSummaryFor(
                            progress.find(
                              (entry) =>
                                entry.condition.trim().toLowerCase() ===
                                scan.condition_name.trim().toLowerCase(),
                            ),
                            t,
                          ),
                        })
                      }
                    >
                      <Download className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("Delete scan")}
                      className="text-destructive hover:text-destructive"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate({ id: scan.id, image_path: scan.image_path })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
