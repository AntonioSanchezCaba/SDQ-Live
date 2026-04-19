export interface WeatherData {
  temperature: number;
  windspeed: number;
  winddirection: number;
  weathercode: number;
  humidity: number;
  visibility: number;
  description: string;
  icon: string;
}

const WEATHER_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: 'Clear Sky', icon: '☀️' },
  1: { description: 'Mainly Clear', icon: '🌤️' },
  2: { description: 'Partly Cloudy', icon: '⛅' },
  3: { description: 'Overcast', icon: '☁️' },
  45: { description: 'Foggy', icon: '🌫️' },
  48: { description: 'Icy Fog', icon: '🌫️' },
  51: { description: 'Light Drizzle', icon: '🌦️' },
  53: { description: 'Drizzle', icon: '🌦️' },
  55: { description: 'Heavy Drizzle', icon: '🌧️' },
  61: { description: 'Slight Rain', icon: '🌧️' },
  63: { description: 'Moderate Rain', icon: '🌧️' },
  65: { description: 'Heavy Rain', icon: '🌧️' },
  71: { description: 'Slight Snow', icon: '❄️' },
  73: { description: 'Moderate Snow', icon: '❄️' },
  75: { description: 'Heavy Snow', icon: '🌨️' },
  80: { description: 'Slight Showers', icon: '🌦️' },
  81: { description: 'Moderate Showers', icon: '🌧️' },
  82: { description: 'Heavy Showers', icon: '⛈️' },
  95: { description: 'Thunderstorm', icon: '⛈️' },
  96: { description: 'Thunderstorm', icon: '⛈️' },
  99: { description: 'Heavy Thunderstorm', icon: '⛈️' },
};

export async function fetchWeather(): Promise<WeatherData> {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=18.4297&longitude=-69.6689&current_weather=true&hourly=relativehumidity_2m,visibility&timezone=America%2FSanto_Domingo&forecast_days=1';
  try {
    const res = await fetch(url);
    const json = await res.json();
    const cw = json.current_weather;
    const code = cw.weathercode as number;
    const meta = WEATHER_CODES[code] || { description: 'Unknown', icon: '🌡️' };
    const hourIdx = Math.min(new Date().getHours(), (json.hourly?.relativehumidity_2m?.length ?? 1) - 1);
    const humidity = json.hourly?.relativehumidity_2m?.[hourIdx] ?? 70;
    const visibility = (json.hourly?.visibility?.[hourIdx] ?? 10000) / 1000;
    return {
      temperature: Math.round(cw.temperature),
      windspeed: Math.round(cw.windspeed),
      winddirection: cw.winddirection,
      weathercode: code,
      humidity,
      visibility: Math.round(visibility * 10) / 10,
      description: meta.description,
      icon: meta.icon,
    };
  } catch {
    return {
      temperature: 29,
      windspeed: 18,
      winddirection: 90,
      weathercode: 1,
      humidity: 72,
      visibility: 10,
      description: 'Mainly Clear',
      icon: '🌤️',
    };
  }
}
