import { ScanReport, type ScanRecord } from "@/components/ScanReport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { analyzeSkinPhoto } from "@/lib/analyze.functions";
import { useTranslate } from "@/lib/i18n";
import { dataUrlToBlob, fileToCompressedDataUrl } from "@/lib/image";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2, MapPin, Sparkles, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/scan")({
  head: () => ({
    meta: [
      { title: "New skin scan — EcoDerm AI" },
      {
        name: "description",
        content:
          "Upload a skin photo and get condition, stage, risk percentage and environmental factors in seconds.",
      },
      { property: "og:title", content: "New skin scan — EcoDerm AI" },
      {
        property: "og:description",
        content: "AI skin screening combined with live UV, air quality, temperature and wind data.",
      },
    ],
  }),
  component: ScanPage,
});

type Coords = { latitude: number; longitude: number };

const UI = [
  "New skin scan",
  "Take a clear close-up of the affected area. EcoDerm AI combines the photo with live UV index, air quality, temperature and wind readings at your location.",
  "1. Photo & context",
  "Good lighting, in focus, no filters.",
  "Change photo",
  "Upload or take a photo",
  "JPG or PNG, close-up of the skin",
  "Notes (optional)",
  "How long has it been there? Itching, pain, spreading?",
  "Use my location",
  "Location captured",
  "Needed for live UV, AQI, temperature and wind readings.",
  "If GPS is blocked, type your city instead",
  "City or area (e.g. Chennai)",
  "Analyse & generate report",
  "Analysing…",
  "Your report",
  "Location is not available in this browser.",
  "Location captured for environmental data.",
  "Location permission was denied. Type your city below instead.",
  "Could not read that image. Try another photo.",
  "That photo doesn't look like skin. Please upload a clear close-up.",
  "Report ready.",
  "Analysis failed. Please try again.",
];

function ScanPage() {
  const { user } = useAuth();
  const analyze = useServerFn(analyzeSkinPhoto);
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [manualPlace, setManualPlace] = useState("");
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const { t } = useTranslate(UI);

  useEffect(() => {
    if (!coords && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          // Handled gracefully via server IP fallback
        },
        { timeout: 8000, maximumAge: 300000 },
      );
    }
  }, [coords]);

  function requestLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error(t("Location is not available in this browser."));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocating(false);
        toast.success(t("Location captured for environmental data."));
      },
      () => {
        setLocating(false);
        toast.error(t("Location permission was denied. Type your city below instead."));
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 60000 },
    );
  }

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setPreview(dataUrl);
      setScan(null);
    } catch {
      toast.error(t("Could not read that image. Try another photo."));
    }
  }

  async function runScan() {
    if (!preview || !user) return;
    setBusy(true);
    try {
      const result = await analyze({
        data: {
          imageDataUrl: preview,
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
          locationQuery: manualPlace.trim() ? manualPlace.trim() : null,
          notes: notes.trim() ? notes.trim() : null,
        },
      });

      if (!result.isSkinImage) {
        toast.error(t("That photo doesn't look like skin. Please upload a clear close-up."));
        setBusy(false);
        return;
      }

      let savedScan: ScanRecord | null = null;
      let imagePath: string | null = null;

      try {
        imagePath = `${user.id}/${crypto.randomUUID()}.jpg`;
        const upload = await supabase.storage
          .from("scan-images")
          .upload(imagePath, dataUrlToBlob(preview), { contentType: "image/jpeg" });
        if (upload?.error) {
          imagePath = null;
        }
      } catch {
        imagePath = null;
      }

      const recordData = {
        user_id: user.id,
        image_path: imagePath,
        condition_name: result.conditionName,
        condition_summary: result.conditionSummary,
        stage: result.stage,
        risk_level: result.riskLevel,
        risk_percentage: result.riskPercentage,
        confidence: result.confidence,
        environmental_impact: result.environmentalImpact,
        causes: result.causes,
        care_advice: result.careAdvice,
        urgency: result.urgency,
        env_uv_index: result.environment.uvIndex,
        env_aqi: result.environment.aqi,
        env_temperature: result.environment.temperature,
        env_wind_speed: result.environment.windSpeed,
        env_humidity: result.environment.humidity,
        location_label: result.environment.locationLabel,
        latitude: result.coordinates?.latitude ?? null,
        longitude: result.coordinates?.longitude ?? null,
      };

      try {
        const { data, error } = await supabase.from("scans").insert(recordData).select().single();

        if (!error && data) {
          savedScan = data as ScanRecord;
        }
      } catch (dbErr) {
        console.warn("Supabase insert note:", dbErr);
      }

      if (!savedScan) {
        savedScan = {
          ...recordData,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        } as ScanRecord;
      }

      try {
        const existing = localStorage.getItem("ecoderm_local_scans");
        const list = existing ? JSON.parse(existing) : [];
        list.unshift(savedScan);
        localStorage.setItem("ecoderm_local_scans", JSON.stringify(list.slice(0, 50)));
      } catch (storageErr) {
        console.warn("LocalStorage save note:", storageErr);
      }

      setScan(savedScan);
      toast.success(t("Report ready."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Analysis failed. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">{t("New skin scan")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        {t(
          "Take a clear close-up of the affected area. EcoDerm AI combines the photo with live UV index, air quality, temperature and wind readings at your location.",
        )}
      </p>

      <Card className="mt-6 border-border/70 bg-card/80 shadow-panel sm:mt-8">
        <CardHeader>
          <CardTitle className="text-lg">{t("1. Photo & context")}</CardTitle>
          <CardDescription>{t("Good lighting, in focus, no filters.")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onPick}
          />

          {preview ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <img
                src={preview}
                alt="Selected skin photo preview"
                className="h-48 w-full rounded-xl border border-border/70 object-cover sm:w-48"
              />
              <Button variant="secondary" onClick={() => fileInput.current?.click()}>
                <Camera className="size-4" />
                {t("Change photo")}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-secondary/30 px-4 py-10 text-center transition-colors hover:border-primary/60 hover:bg-secondary/50 sm:px-6 sm:py-12"
            >
              <span className="grid size-12 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
                <Upload className="size-5" />
              </span>
              <span className="font-medium">{t("Upload or take a photo")}</span>
              <span className="text-xs text-muted-foreground">
                {t("JPG or PNG, close-up of the skin")}
              </span>
            </button>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="notes">
              {t("Notes (optional)")}
            </label>
            <Textarea
              id="notes"
              placeholder={t("How long has it been there? Itching, pain, spreading?")}
              value={notes}
              maxLength={500}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <div className="space-y-3 rounded-xl border border-border/70 bg-secondary/30 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={requestLocation}
                disabled={locating}
              >
                {locating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <MapPin className="size-4" />
                )}
                {coords ? t("Location captured") : t("Use my location")}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t("Needed for live UV, AQI, temperature and wind readings.")}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground" htmlFor="place">
                {t("If GPS is blocked, type your city instead")}
              </label>
              <Input
                id="place"
                placeholder={t("City or area (e.g. Chennai)")}
                value={manualPlace}
                maxLength={120}
                onChange={(event) => setManualPlace(event.target.value)}
              />
            </div>
          </div>

          <Button
            className="w-full bg-gradient-primary text-primary-foreground"
            size="lg"
            disabled={!preview || busy}
            onClick={runScan}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {busy ? t("Analysing…") : t("Analyse & generate report")}
          </Button>
        </CardContent>
      </Card>

      {scan ? (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-xl font-semibold sm:text-2xl">
            {t("Your report")}
          </h2>
          <ScanReport scan={scan} imageUrl={preview} />
        </section>
      ) : null}
    </main>
  );
}
