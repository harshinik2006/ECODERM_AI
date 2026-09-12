import heroImage from "@/assets/hero-skin-scan.jpg";
import logoAsset from "@/assets/logo.png.asset.json";
import { LanguageSelect } from "@/components/LanguageSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useTranslate } from "@/lib/i18n";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Activity, Camera, FileText, Leaf, MapPin, ShieldCheck, Sun, Wind } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EcoDerm AI — AI skin screening with environmental risk" },
      {
        name: "description",
        content:
          "Photograph a skin concern and get the likely condition, stage, risk percentage, environmental causes and nearby dermatologists.",
      },
      { property: "og:title", content: "EcoDerm AI — AI skin screening with environmental risk" },
      {
        property: "og:description",
        content:
          "AI skin analysis combined with live UV index, air quality, temperature and wind data.",
      },
    ],
  }),
  component: Landing,
});

const steps = [
  {
    icon: Camera,
    title: "Capture",
    body: "Take or upload a close-up photo of the affected skin area.",
  },
  {
    icon: Activity,
    title: "Analyse",
    body: "AI identifies the likely condition, its stage and a precise risk percentage.",
  },
  {
    icon: Leaf,
    title: "Explain",
    body: "Live UV, AQI, temperature and wind readings explain why it is flaring up.",
  },
  {
    icon: MapPin,
    title: "Act",
    body: "Get a report and the nearest dermatologists around your location.",
  },
];

const factors = [
  { icon: Sun, label: "UV index", body: "Sun exposure driving pigmentation and burn risk." },
  { icon: Wind, label: "Air quality", body: "Particulate load linked to irritation and acne." },
  { icon: Activity, label: "Temperature", body: "Heat and sweat triggering rashes and eczema." },
  { icon: Wind, label: "Wind speed", body: "Moisture loss causing dryness and cracking." },
];

const UI = [
  "Open app",
  "Sign in",
  "AI + environmental science",
  "Know your skin risk before it becomes a problem",
  "Send a photo. EcoDerm AI names the likely condition, tells you which stage it is in, gives a risk percentage, and links it to the UV index, air quality, temperature and wind at your location — then points you to the nearest dermatologist.",
  "Start a scan",
  "View reports",
  "How it works",
  "Environmental factors we score against",
  "Skin conditions rarely appear without a trigger. Every report explains the connection between your surroundings and what your skin is doing.",
  "Your first report takes a minute",
  "Scans stay private to your account. Download or delete any report whenever you want.",
  "Get started free",
  "EcoDerm AI provides educational screening insights and does not replace a medical diagnosis. Always consult a qualified dermatologist.",
  ...steps.flatMap((step) => [step.title, step.body]),
  ...factors.flatMap((factor) => [factor.label, factor.body]),
];

function Landing() {
  const { user } = useAuth();
  const { t } = useTranslate(UI);
  const primaryTo = user ? "/scan" : "/auth";

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5">
        <span className="flex min-w-0 items-center gap-2">
          <img
            src={logoAsset.url}
            alt="EcoDerm AI logo"
            width={36}
            height={36}
            className="size-9 shrink-0 rounded-xl object-cover"
          />
          <span className="truncate font-display text-base font-semibold sm:text-lg">
            EcoDerm AI
          </span>
        </span>
        <span className="flex items-center gap-2">
          <LanguageSelect />
          <Button asChild variant="secondary" size="sm">
            <Link to={primaryTo}>{user ? t("Open app") : t("Sign in")}</Link>
          </Button>
        </span>
      </header>

      <main>
        <section className="bg-hero">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:py-16 lg:grid-cols-2 lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
                <ShieldCheck className="size-3.5" />
                {t("AI + environmental science")}
              </span>
              <h1 className="mt-5 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                {t("Know your skin risk before it becomes a problem")}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                {t(
                  "Send a photo. EcoDerm AI names the likely condition, tells you which stage it is in, gives a risk percentage, and links it to the UV index, air quality, temperature and wind at your location — then points you to the nearest dermatologist.",
                )}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground">
                  <Link to={primaryTo}>
                    <Camera className="size-4" />
                    {t("Start a scan")}
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link to={user ? "/history" : "/auth"}>
                    <FileText className="size-4" />
                    {t("View reports")}
                  </Link>
                </Button>
              </div>
            </div>

            <img
              src={heroImage}
              alt="Diagnostic light scanning skin on a forearm with environmental data overlays"
              width={1536}
              height={1024}
              className="w-full rounded-3xl border border-border/70 object-cover shadow-panel"
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">{t("How it works")}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <Card key={step.title} className="border-border/70 bg-card/80">
                <CardContent className="space-y-3 py-6">
                  <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                    <step.icon className="size-5" />
                  </span>
                  <h3 className="font-display text-lg font-semibold">{t(step.title)}</h3>
                  <p className="text-sm text-muted-foreground">{t(step.body)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-border/60 bg-secondary/20">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              {t("Environmental factors we score against")}
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              {t(
                "Skin conditions rarely appear without a trigger. Every report explains the connection between your surroundings and what your skin is doing.",
              )}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {factors.map((factor) => (
                <div
                  key={factor.label}
                  className="rounded-2xl border border-border/70 bg-card/70 p-5"
                >
                  <factor.icon className="size-5 text-primary" />
                  <h3 className="mt-3 font-medium">{t(factor.label)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t(factor.body)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-20">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            {t("Your first report takes a minute")}
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            {t(
              "Scans stay private to your account. Download or delete any report whenever you want.",
            )}
          </p>
          <Button asChild size="lg" className="mt-8 bg-gradient-primary text-primary-foreground">
            <Link to={primaryTo}>{t("Get started free")}</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <p className="mx-auto max-w-6xl px-4 text-xs text-muted-foreground">
          {t(
            "EcoDerm AI provides educational screening insights and does not replace a medical diagnosis. Always consult a qualified dermatologist.",
          )}
        </p>
      </footer>
    </div>
  );
}
