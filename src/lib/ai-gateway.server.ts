import { GoogleGenAI } from "@google/genai";

export type GatewayMessage = {
  role: "system" | "user";
  content: string | Array<Record<string, unknown>>;
};

export class GatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new GatewayError(
      401,
      "GEMINI_API_KEY is not configured. Please ensure your Google Gemini API key is set in project settings.",
    );
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

export async function callGatewayChat(options: {
  model: string;
  messages: GatewayMessage[];
  responseFormat?: Record<string, unknown>;
}): Promise<string> {
  const gemini = getGeminiClient();

  try {
    const systemMessage = options.messages.find((m) => m.role === "system");
    const systemInstruction =
      typeof systemMessage?.content === "string" ? systemMessage.content : undefined;

    const userMessages = options.messages.filter((m) => m.role === "user");

    const contents: Array<
      string | { text: string } | { inlineData: { mimeType: string; data: string } }
    > = [];

    for (const msg of userMessages) {
      if (typeof msg.content === "string") {
        contents.push({ text: msg.content });
      } else if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part["type"] === "text" && typeof part["text"] === "string") {
            contents.push({ text: part["text"] });
          } else if (part["type"] === "image_url") {
            const url = (part["image_url"] as { url?: string } | undefined)?.url;
            if (url && typeof url === "string") {
              const match = url.match(/^data:(.*?);base64,(.*)$/);
              if (match?.[1] && match?.[2]) {
                contents.push({
                  inlineData: {
                    mimeType: match[1],
                    data: match[2],
                  },
                });
              }
            }
          }
        }
      }
    }

    const config: Record<string, unknown> = {};
    if (systemInstruction) {
      config["systemInstruction"] = systemInstruction;
    }

    if (options.responseFormat?.["type"] === "json_object") {
      config["responseMimeType"] = "application/json";
    } else if (
      options.responseFormat?.["type"] === "json_schema" &&
      (options.responseFormat["json_schema"] as { schema?: unknown })?.schema
    ) {
      config["responseMimeType"] = "application/json";
      config["responseSchema"] = (
        options.responseFormat["json_schema"] as { schema?: unknown }
      ).schema;
    }

    // Models supported natively in @google/genai
    const preferredModel = options.model?.replace(/^google\//, "");
    const baseModels = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.1-pro-preview"];
    const modelsToTry = preferredModel
      ? [preferredModel, ...baseModels.filter((m) => m !== preferredModel)]
      : baseModels;
    let lastErr: unknown;

    for (const model of modelsToTry) {
      try {
        const res = await gemini.models.generateContent({
          model,
          contents: contents.length > 0 ? contents : ["Hello"],
          config,
        });
        const text = res.text;
        if (text) return text;
      } catch (err) {
        lastErr = err;
        console.warn(
          `[Gemini Model ${model} retry note]`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    if (lastErr) {
      console.error("[Gemini AI Error]", lastErr);
      throw lastErr;
    }
    throw new GatewayError(502, "Gemini returned an empty response.");
  } catch (err) {
    if (err instanceof GatewayError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new GatewayError(500, `Gemini AI processing error: ${message}`);
  }
}
