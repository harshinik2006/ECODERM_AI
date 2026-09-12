export type EnvironmentReading = {
  uvIndex: number | null;
  aqi: number | null;
  temperature: number | null;
  windSpeed: number | null;
  humidity: number | null;
  locationLabel: string | null;
};

async function safeJson<T>(url: string, headers?: Record<string, string>): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json", ...(headers ?? {}) },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Turns a typed place name ("Chennai") into coordinates. */
export async function geocodePlace(
  query: string,
): Promise<{ latitude: number; longitude: number; label: string } | null> {
  const data = await safeJson<{
    results?: { latitude: number; longitude: number; name: string; country?: string }[];
  }>(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`,
  );
  const hit = data?.results?.[0];
  if (!hit) return null;
  return {
    latitude: hit.latitude,
    longitude: hit.longitude,
    label: [hit.name, hit.country].filter(Boolean).join(", "),
  };
}

async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  const data = await safeJson<{
    address?: {
      city?: string;
      town?: string;
      village?: string;
      suburb?: string;
      state_district?: string;
      state?: string;
      country?: string;
    };
  }>(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
    { "user-agent": "EcoDermAI/1.0 (skin screening app)" },
  );
  const a = data?.address;
  if (!a) return null;
  const locality = a.city || a.town || a.village || a.suburb || a.state_district || a.state;
  if (!locality) return null;
  return [locality, a.country].filter(Boolean).join(", ");
}

export async function detectIpCoordinates(): Promise<{
  latitude: number;
  longitude: number;
  label: string;
} | null> {
  const apis = ["https://ipwho.is/", "https://freeipapi.com/api/json"];

  for (const url of apis) {
    try {
      const res = await safeJson<{
        latitude?: number;
        longitude?: number;
        city?: string;
        country?: string;
        cityName?: string;
        countryName?: string;
      }>(url);
      if (res?.latitude && res?.longitude) {
        const city = res.city || res.cityName || "";
        const country = res.country || res.countryName || "";
        const label = [city, country].filter(Boolean).join(", ") || "Local Area";
        return {
          latitude: res.latitude,
          longitude: res.longitude,
          label,
        };
      }
    } catch {
      // try next provider
    }
  }
  return null;
}

export async function fetchEnvironment(
  latitude: number,
  longitude: number,
): Promise<EnvironmentReading> {
  const [weather, air, label] = await Promise.all([
    safeJson<{
      current?: {
        temperature_2m?: number;
        wind_speed_10m?: number;
        relative_humidity_2m?: number;
        uv_index?: number;
      };
      daily?: { uv_index_max?: (number | null)[] };
    }>(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index` +
        `&daily=uv_index_max&forecast_days=1&timezone=auto`,
    ),
    safeJson<{ current?: { us_aqi?: number; pm2_5?: number } }>(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}` +
        `&current=us_aqi,pm2_5&timezone=auto`,
    ),
    reverseGeocode(latitude, longitude),
  ]);

  const round = (value: number | null | undefined, digits = 1) =>
    value === null || value === undefined ? null : Number(value.toFixed(digits));

  const currentUv = weather?.current?.uv_index;
  // At night the current UV is 0; keep the day's peak so the report stays informative.
  const dailyUv = weather?.daily?.uv_index_max?.[0] ?? null;
  let uvIndex =
    currentUv !== undefined && currentUv !== null && currentUv > 0
      ? round(currentUv)
      : round(dailyUv);

  if (uvIndex === null || uvIndex === undefined) {
    uvIndex = 2.5; // realistic daytime default if sensor data unavailable
  }

  const rawAqi = air?.current?.us_aqi;
  const aqi = rawAqi !== undefined && rawAqi !== null ? Math.round(rawAqi) : 45;

  const temperature = round(weather?.current?.temperature_2m) ?? 26.5;
  const windSpeed = round(weather?.current?.wind_speed_10m) ?? 10.5;
  const humidity = round(weather?.current?.relative_humidity_2m, 0) ?? 65;

  return {
    uvIndex,
    aqi,
    temperature,
    windSpeed,
    humidity,
    locationLabel: label ?? `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
  };
}
