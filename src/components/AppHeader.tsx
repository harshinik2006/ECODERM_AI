import logoAsset from "@/assets/logo.png.asset.json";
import { LanguageSelect } from "@/components/LanguageSelect";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useTranslate } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { LineChart, LogOut, Menu } from "lucide-react";
import { useState } from "react";

const NAV_STRINGS = ["New scan", "History", "Progress", "Sign out", "Sign in", "Menu"];

export function AppHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { t } = useTranslate(NAV_STRINGS);

  const linkClass =
    "rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";
  const activeClass = { className: "rounded-md px-3 py-2 bg-secondary text-foreground" };

  const navLinks = (
    <>
      <Link
        to="/scan"
        className={linkClass}
        activeProps={activeClass}
        onClick={() => setOpen(false)}
      >
        {t("New scan")}
      </Link>
      <Link
        to="/history"
        className={linkClass}
        activeProps={activeClass}
        onClick={() => setOpen(false)}
      >
        {t("History")}
      </Link>
      <Link
        to="/progress"
        className={cn(linkClass, "flex items-center gap-1.5")}
        activeProps={activeClass}
        onClick={() => setOpen(false)}
      >
        <LineChart className="size-4" />
        {t("Progress")}
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img
            src={logoAsset.url}
            alt="EcoDerm AI logo"
            width={36}
            height={36}
            className="size-9 shrink-0 rounded-xl object-cover"
          />
          <span className="truncate font-display text-base font-semibold tracking-tight sm:text-lg">
            EcoDerm AI
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSelect />

          {user ? (
            <>
              <nav className="hidden items-center gap-1 text-sm md:flex">
                {navLinks}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="size-4" />
                  {t("Sign out")}
                </Button>
              </nav>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label={t("Menu")}
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
              >
                {open ? <Menu className="size-5 rotate-90" /> : <Menu className="size-5" />}
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="bg-gradient-primary text-primary-foreground">
              <Link to="/auth">{t("Sign in")}</Link>
            </Button>
          )}
        </div>
      </div>

      {user && open ? (
        <nav className="flex flex-col gap-1 border-t border-border/60 px-4 py-3 text-sm md:hidden">
          {navLinks}
          <Button
            variant="secondary"
            size="sm"
            className="mt-1 justify-start"
            onClick={async () => {
              setOpen(false);
              await supabase.auth.signOut();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="size-4" />
            {t("Sign out")}
          </Button>
        </nav>
      ) : null}
    </header>
  );
}
