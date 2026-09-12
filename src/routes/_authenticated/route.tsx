import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [loading, user, navigate]);

  // Google sign-ups created before the profile trigger existed have no row yet.
  useEffect(() => {
    if (!user) return;
    void supabase.from("profiles").upsert(
      {
        id: user.id,
        display_name:
          (user.user_metadata?.["full_name"] as string | undefined) ??
          (user.user_metadata?.["display_name"] as string | undefined) ??
          user.email ??
          null,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
  }, [user]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <Outlet />
    </div>
  );
}
