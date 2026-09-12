import { LanguageSelect } from "@/components/LanguageSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useTranslate } from "@/lib/i18n";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — EcoDerm AI" },
      {
        name: "description",
        content:
          "Sign in to EcoDerm AI to run environmental skin scans and keep your report history.",
      },
      { property: "og:title", content: "Sign in — EcoDerm AI" },
      {
        property: "og:description",
        content: "Access your EcoDerm AI skin scans, risk reports and history.",
      },
    ],
  }),
  component: AuthPage,
});

const UI = [
  "Welcome",
  "Your scans, risk reports and history stay private to your account.",
  "Continue with Google",
  "or use email",
  "Sign in",
  "Create account",
  "Email",
  "Password",
  "Name",
  "Account created. You can start scanning now.",
  "Account created and signed in!",
];

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useTranslate(UI);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/scan" });
  }, [loading, user, navigate]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/scan" });
  }

  async function signUp(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/scan`,
          data: { display_name: name || email.split("@")[0] },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.session) {
        toast.success(t("Account created. You can start scanning now."));
        navigate({ to: "/scan" });
        return;
      }

      // Try immediate auto-login in case email auto-confirmed
      const signInAttempt = await supabase.auth.signInWithPassword({ email, password });
      if (signInAttempt.data?.session) {
        toast.success(t("Account created and signed in!"));
        navigate({ to: "/scan" });
        return;
      }

      toast.success(
        "Account created! If confirmation is required, please check your inbox or sign in.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create account.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setGoogleBusy(true);
    setGoogleNotice(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/scan`,
        },
      });

      if (error) {
        setGoogleNotice(
          "Google Sign-In is not enabled yet in your Supabase project (missing Google OAuth credentials in Supabase Dashboard under Authentication > Providers > Google). Please use Email and Password below.",
        );
        toast.error(`Google sign-in error: ${error.message}`);
        return;
      }

      if (data?.url) {
        // Pre-flight check to verify provider is configured before leaving the app
        try {
          const res = await fetch(data.url, { method: "GET" });
          if (!res.ok) {
            const body = (await res.json().catch(() => null)) as {
              msg?: string;
              error_code?: string;
            } | null;
            if (
              body?.msg?.toLowerCase().includes("missing oauth secret") ||
              body?.error_code === "validation_failed"
            ) {
              setGoogleNotice(
                "Google Sign-In requires configuring Google OAuth in your Supabase project (Authentication > Providers > Google). Please sign in or create an account with Email & Password below!",
              );
              toast.info(
                "Google OAuth provider not configured in Supabase. Please sign up or sign in with your email.",
              );
              return;
            }
          }
        } catch {
          // If browser CORS restrictions prevent reading the pre-check, proceed to redirect
        }

        window.location.href = data.url;
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Google sign-in failed. Please try again.",
      );
    } finally {
      setGoogleBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-hero px-4 py-12">
      <div className="absolute right-4 top-4">
        <LanguageSelect />
      </div>

      <Link to="/" className="mb-8 flex items-center gap-3">
        <img
          src="/logo.png"
          alt="EcoDerm AI logo"
          width={44}
          height={44}
          className="size-11 rounded-xl object-cover shadow-sm ring-1 ring-border/50"
        />
        <span className="font-display text-2xl font-bold tracking-tight">EcoDerm AI</span>
      </Link>

      <Card className="w-full max-w-md border-border/70 bg-card/90 shadow-panel backdrop-blur">
        <CardHeader>
          <CardTitle className="font-display text-xl">{t("Welcome")}</CardTitle>
          <CardDescription>
            {t("Your scans, risk reports and history stay private to your account.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Button
            variant="outline"
            className="w-full gap-2 border-border/80"
            onClick={google}
            disabled={googleBusy || busy}
          >
            {googleBusy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <svg className="size-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            {t("Continue with Google")}
          </Button>

          {googleNotice && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-600 dark:text-amber-400">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div>{googleNotice}</div>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t("or use email")}
            <span className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="w-full">
              <TabsTrigger value="signin" className="flex-1">
                {t("Sign in")}
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">
                {t("Create account")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form className="space-y-4 pt-4" onSubmit={signIn}>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("Email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("Password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-gradient-primary text-primary-foreground"
                >
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  {t("Sign in")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form className="space-y-4 pt-4" onSubmit={signUp}>
                <div className="space-y-2">
                  <Label htmlFor="name">{t("Name")}</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-up">{t("Email")}</Label>
                  <Input
                    id="email-up"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password-up">{t("Password")}</Label>
                    <span className="text-xs text-muted-foreground">Min 6 characters</span>
                  </div>
                  <Input
                    id="password-up"
                    type="password"
                    required
                    minLength={6}
                    placeholder="e.g. EcoDerm#2026!"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-gradient-primary text-primary-foreground"
                >
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  {t("Create account")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
