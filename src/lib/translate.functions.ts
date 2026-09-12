import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { translateStrings } from "./translate.server";

const TranslateSchema = z.object({
  texts: z.array(z.string()).max(120),
  targetLanguage: z.string().min(2).max(40),
});

export const translateTexts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TranslateSchema.parse(input))
  .handler(async ({ data }) => {
    const texts = data.texts.slice(0, 120).map((text) => text.slice(0, 1200));
    const items = await translateStrings({ texts, targetLanguage: data.targetLanguage });
    return { items };
  });
