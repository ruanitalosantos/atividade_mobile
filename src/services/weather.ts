import * as Location from 'expo-location';
import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Clima atual a partir da localização do aparelho.
 * API externa: Open-Meteo (https://open-meteo.com) — gratuita e sem chave de acesso.
 */

export type Weather = {
  temperature: number;
  windSpeed: number;
  description: string;
  city: string | null;
  fetchedAt: string;
};

export type WeatherResult = {
  weather: Weather;
  fromCache: boolean;
};

const CACHE_KEY = 'weather';
const REQUEST_TIMEOUT_MS = 8000;

export class WeatherError extends Error {}

// Códigos WMO usados pela Open-Meteo.
function describeWeatherCode(code: number): string {
  if (code === 0) return 'Céu limpo';
  if (code <= 3) return 'Parcialmente nublado';
  if (code === 45 || code === 48) return 'Neblina';
  if (code >= 51 && code <= 57) return 'Garoa';
  if (code >= 61 && code <= 67) return 'Chuva';
  if (code >= 71 && code <= 77) return 'Neve';
  if (code >= 80 && code <= 82) return 'Pancadas de chuva';
  if (code >= 95) return 'Tempestade';
  return 'Indefinido';
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function getCityName(latitude: number, longitude: number): Promise<string | null> {
  try {
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    return address?.city ?? address?.subregion ?? address?.region ?? null;
  } catch {
    return null; // nome da cidade é opcional
  }
}

async function fetchCurrentWeather(): Promise<Weather> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new WeatherError('Permissão de localização negada.');
  }

  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const { latitude, longitude } = position.coords;

  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}` +
    '&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto';

  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new WeatherError(`Serviço de clima indisponível (HTTP ${response.status}).`);
  }
  const json = await response.json();
  if (!json?.current) {
    throw new WeatherError('Resposta inesperada do serviço de clima.');
  }

  return {
    temperature: Math.round(json.current.temperature_2m),
    windSpeed: Math.round(json.current.wind_speed_10m),
    description: describeWeatherCode(json.current.weather_code),
    city: await getCityName(latitude, longitude),
    fetchedAt: new Date().toISOString(),
  };
}

async function readCache(db: SQLiteDatabase): Promise<Weather | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM cache WHERE key = ?', CACHE_KEY);
  if (!row) return null;
  try {
    return JSON.parse(row.value) as Weather;
  } catch {
    return null;
  }
}

async function writeCache(db: SQLiteDatabase, weather: Weather): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO cache (key, value, updated_at) VALUES (?, ?, ?)',
    CACHE_KEY,
    JSON.stringify(weather),
    weather.fetchedAt,
  );
}

/**
 * Busca o clima online; se falhar (sem internet, sem permissão, timeout),
 * devolve o último valor salvo para o app continuar funcionando offline.
 */
export async function getWeather(db: SQLiteDatabase): Promise<WeatherResult> {
  try {
    const weather = await fetchCurrentWeather();
    await writeCache(db, weather);
    return { weather, fromCache: false };
  } catch (error) {
    const cached = await readCache(db);
    if (cached) return { weather: cached, fromCache: true };
    if (error instanceof WeatherError) throw error;
    throw new WeatherError('Não foi possível obter o clima. Verifique sua conexão.');
  }
}
