import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { runAnalysis } from "./analyze.server";

const AnalyzeSchema = z.object({
  imageDataUrl: z.string().min(32),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  locationQuery: z.string().max(120).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const analyzeSkinPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnalyzeSchema.parse(input))
  .handler(async ({ data }) => {
    return await runAnalysis(data);
  });
