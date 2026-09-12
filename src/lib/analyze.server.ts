import { callGatewayChat } from "./ai-gateway.server";
import {
  detectIpCoordinates,
  fetchEnvironment,
  geocodePlace,
  type EnvironmentReading,
} from "./environment.server";

export type AnalyzeInput = {
  imageDataUrl: string;
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
  locationQuery?: string | null | undefined;
  notes?: string | null | undefined;
};

export type AnalysisResult = {
  isSkinImage: boolean;
  coordinates: { latitude: number; longitude: number } | null;
  conditionName: string;
  conditionSummary: string;
  stage: string;
  riskLevel: "low" | "medium" | "high";
  riskPercentage: number;
  confidence: number;
  environmentalImpact: string;
  causes: string[];
  careAdvice: string[];
  urgency: string;
  environment: EnvironmentReading;
};

const RESULT_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "skin_analysis",
    schema: {
      type: "object",
      properties: {
        isSkinImage: { type: "boolean" },
        conditionName: { type: "string" },
        conditionSummary: { type: "string" },
        stage: { type: "string" },
        riskLevel: { type: "string", enum: ["low", "medium", "high"] },
        riskPercentage: { type: "number" },
        confidence: { type: "number" },
        environmentalImpact: { type: "string" },
        causes: { type: "array", items: { type: "string" } },
        careAdvice: { type: "array", items: { type: "string" } },
        urgency: { type: "string" },
      },
      required: [
        "isSkinImage",
        "conditionName",
        "conditionSummary",
        "stage",
        "riskLevel",
        "riskPercentage",
        "confidence",
        "environmentalImpact",
        "causes",
        "careAdvice",
        "urgency",
      ],
      additionalProperties: false,
    },
  },
} as const;

const SYSTEM_PROMPT = `You are EcoDerm AI, an environmental dermatology screening assistant.
You look at a photo of human skin and produce a cautious, educational (non-diagnostic) assessment.

Rules:
- If the photo is not human skin, set isSkinImage to false and explain that in conditionSummary.
- conditionName: the most likely skin condition in plain words (e.g. "Acne vulgaris", "Contact dermatitis", "Sun-induced hyperpigmentation", "Suspicious pigmented lesion").
- stage: describe progression as one of "Starting stage", "Second stage", "Advanced stage" or "Not clearly staged", with a few words of detail.
- riskLevel: low | medium | high. riskPercentage: 0-100 integer estimating overall risk. confidence: 0-100 integer.
- environmentalImpact: 2-3 sentences tying the given live environmental readings (UV index, air quality index, temperature, wind speed, humidity) to why this condition may have appeared or worsened. Reference the actual numbers.
- causes: 3-5 short bullet strings of likely contributing causes, environmental ones first.
- careAdvice: 3-5 short, safe, practical steps (sun protection, cleansing, hydration, avoiding irritants) plus when to see a dermatologist.
- urgency: one short sentence on how soon a dermatologist should be seen.
Keep every string concise. Never claim a definitive medical diagnosis.`;

export async function runAnalysis(input: AnalyzeInput): Promise<AnalysisResult> {
  let coordinates: { latitude: number; longitude: number } | null =
    typeof input.latitude === "number" && typeof input.longitude === "number"
      ? { latitude: input.latitude, longitude: input.longitude }
      : null;

  // Fallback 1 for devices/WebViews that block GPS: the person typed a place name.
  if (!coordinates && input.locationQuery) {
    const place = await geocodePlace(input.locationQuery);
    if (place) coordinates = { latitude: place.latitude, longitude: place.longitude };
  }

  // Fallback 2: automatic IP geolocation detection so environmental data is always captured
  if (!coordinates) {
    const detected = await detectIpCoordinates();
    if (detected) {
      coordinates = { latitude: detected.latitude, longitude: detected.longitude };
    }
  }

  // Fallback 3: regional default coordinates if completely offline or blocked
  const activeCoords = coordinates ?? { latitude: 13.0827, longitude: 80.2707 };
  const environment: EnvironmentReading = await fetchEnvironment(
    activeCoords.latitude,
    activeCoords.longitude,
  );

  const envText = [
    `UV index: ${environment.uvIndex ?? "unknown"}`,
    `Air Quality Index (US AQI): ${environment.aqi ?? "unknown"}`,
    `Temperature: ${environment.temperature ?? "unknown"} °C`,
    `Wind speed: ${environment.windSpeed ?? "unknown"} km/h`,
    `Humidity: ${environment.humidity ?? "unknown"} %`,
    `Location: ${environment.locationLabel ?? "unknown"}`,
  ].join("\n");

  const content = await callGatewayChat({
    model: "gemini-3.8-flash",
    responseFormat: RESULT_SCHEMA as unknown as Record<string, unknown>,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              `Analyse this skin photo.\n\nLive environmental readings at the person's location:\n${envText}` +
              (input.notes ? `\n\nPerson's notes: ${input.notes}` : ""),
          },
          { type: "image_url", image_url: { url: input.imageDataUrl } },
        ],
      },
    ],
  });

  const parsed = JSON.parse(content) as Omit<AnalysisResult, "environment">;

  const clamp = (value: number) =>
    Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));

  return {
    ...parsed,
    coordinates,
    riskPercentage: clamp(parsed.riskPercentage),
    confidence: clamp(parsed.confidence),
    causes: (parsed.causes ?? []).slice(0, 6),
    careAdvice: (parsed.careAdvice ?? []).slice(0, 6),
    environment,
  };
}
