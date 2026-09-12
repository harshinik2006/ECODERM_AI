import { ScanReport, type ScanRecord } from "@/components/ScanReport";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/report/$id")({
  head: () => ({
    meta: [
      { title: "Scan report — EcoDerm AI" },
      {
        name: "description",
        content:
          "Full skin screening report: condition, stage, risk percentage, environmental factors and dermatologist recommendation.",
      },
      { property: "og:title", content: "Scan report — EcoDerm AI" },
      {
        property: "og:description",
        content: "Detailed EcoDerm AI report with risk analysis and environmental context.",
      },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { id } = Route.useParams();

  const reportQuery = useQuery({
    queryKey: ["scan", id],
    queryFn: async () => {
      let scanData: ScanRecord | null = null;
      let imageUrl: string | null = null;

      try {
        const { data, error } = await supabase.from("scans").select("*").eq("id", id).single();
        if (!error && data) {
          scanData = data as unknown as ScanRecord;
          if (data.image_path) {
            const signed = await supabase.storage
              .from("scan-images")
              .createSignedUrl(data.image_path, 3600);
            imageUrl = signed.data?.signedUrl ?? null;
          }
        }
      } catch (err) {
        console.warn("Supabase single scan fetch note:", err);
      }

      if (!scanData) {
        try {
          const stored = localStorage.getItem("ecoderm_local_scans");
          if (stored) {
            const list = JSON.parse(stored) as ScanRecord[];
            const found = list.find((s) => s.id === id);
            if (found) scanData = found;
          }
        } catch {
          // ignore
        }
      }

      if (!scanData) throw new Error("Report not found");

      return { scan: scanData as ScanRecord, imageUrl };
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
        <Link to="/history">
          <ArrowLeft className="size-4" />
          Back to history
        </Link>
      </Button>

      {reportQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : reportQuery.data ? (
        <ScanReport scan={reportQuery.data.scan} imageUrl={reportQuery.data.imageUrl} />
      ) : (
        <p className="text-sm text-muted-foreground">This report could not be found.</p>
      )}
    </main>
  );
}
