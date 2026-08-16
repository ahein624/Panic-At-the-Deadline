import type { WeatherSnapshot } from "@/lib/types";

const weatherCodes: Record<number, string> = {
  0: "clear", 1: "mostly clear", 2: "partly cloudy", 3: "cloudy",
  45: "foggy", 48: "foggy", 51: "drizzly", 53: "drizzly", 55: "drizzly",
  61: "rainy", 63: "rainy", 65: "very rainy", 71: "snowy", 73: "snowy",
  75: "very snowy", 80: "showery", 81: "showery", 82: "very showery",
  95: "stormy", 96: "stormy", 99: "stormy",
};

function sassFor(condition: string, temperature: number) {
  if (condition.includes("storm")) return "The sky chose boss-battle music.";
  if (condition.includes("rain") || condition.includes("drizz") || condition.includes("shower")) return "The sky is doing emotional damage.";
  if (condition.includes("snow")) return "Free texture pack: winter edition.";
  if (condition.includes("fog")) return "Visibility has entered stealth mode.";
  if (temperature <= 45) return "Your hoodie has been promoted to essential equipment.";
  if (temperature >= 85) return "Outside is running the overheating cutscene.";
  if (condition.includes("cloud")) return "The sun left the group chat.";
  return "Suspiciously decent weather. Proceed carefully.";
}

export async function getWeather(): Promise<WeatherSnapshot> {
  const latitude = process.env.WEATHER_LATITUDE ?? "40.4284";
  const longitude = process.env.WEATHER_LONGITUDE ?? "-79.6975";
  const params = new URLSearchParams({
    latitude, longitude,
    current: "temperature_2m,weather_code",
    daily: "temperature_2m_max,temperature_2m_min",
    temperature_unit: "fahrenheit",
    timezone: process.env.TZ ?? "America/New_York",
    forecast_days: "1",
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { next: { revalidate: 900 } });
    if (!response.ok) throw new Error("Weather service unavailable");
    const data = await response.json();
    const temperature = Math.round(data.current.temperature_2m);
    const condition = weatherCodes[data.current.weather_code] ?? "mysterious";
    return {
      temperature,
      condition,
      high: Math.round(data.daily.temperature_2m_max[0]),
      low: Math.round(data.daily.temperature_2m_min[0]),
      sass: sassFor(condition, temperature),
    };
  } catch {
    return { temperature: 68, condition: "cloudy", high: 72, low: 61, sass: "The weather server is being mysterious." };
  }
}
