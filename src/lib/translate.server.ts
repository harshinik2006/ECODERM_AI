import { callGatewayChat } from "./ai-gateway.server";

export async function translateStrings(input: {
  texts: string[];
  targetLanguage: string;
}): Promise<string[]> {
  const { texts, targetLanguage } = input;
  if (texts.length === 0) return [];

  const raw = await callGatewayChat({
    model: "gemini-3.8-flash",
    messages: [
      {
        role: "system",
        content:
          'You are a medical UI translator. Translate each item of the given JSON array into the requested language. Keep medical terms accurate, keep numbers, percentages and units unchanged, and keep the tone concise. Return ONLY a JSON object of the form {"items":[...]} with exactly the same number of items in the same order.',
      },
      {
        role: "user",
        content: `Target language: ${targetLanguage}\n\n${JSON.stringify(texts)}`,
      },
    ],
    responseFormat: { type: "json_object" },
  });

  let items: unknown;
  try {
    items = (JSON.parse(raw) as { items?: unknown }).items;
  } catch {
    return texts;
  }
  if (!Array.isArray(items) || items.length !== texts.length) return texts;

  return items.map((item, index) =>
    typeof item === "string" && item.trim() ? item : texts[index]!,
  );
}
