export type Thresholds = {
  heavyRainMm3h: number;   // mm rain over 3 hours
  highWindMs: number;      // m/s
  highTempC: number;       // °C
  lowTempC: number;        // °C
};

export const defaultThresholds: Thresholds = {
  heavyRainMm3h: 5,        // Adjust to taste
  highWindMs: 12,          // ~27 mph
  highTempC: 10,
  lowTempC: -5,
};

export type Trigger = {
  type: 'rain' | 'wind' | 'temp-high' | 'temp-low';
  value: number;
  threshold: number;
  at: string; // ISO or human time
};

// Evaluate next ~24h from OpenWeather 5-day/3-hour forecast
export function evaluateForecast(forecast: any, thresholds: Thresholds = defaultThresholds): Trigger[] {
  const list: any[] = Array.isArray(forecast?.list) ? forecast.list : [];
  const slice = list.slice(0, 8); // 8 x 3h = 24h
  const triggers: Trigger[] = [];

  for (const item of slice) {
    const at = item?.dt_txt ?? (item?.dt ? new Date(item.dt * 1000).toISOString() : new Date().toISOString());
    const rain3h = item?.rain?.['3h'] ?? item?.rain?.['1h'] ?? 0;
    const windMs = item?.wind?.speed ?? 0;
    const tempC = item?.main?.temp;

    if (typeof tempC === 'number') {
      if (tempC >= thresholds.highTempC) {
        triggers.push({ type: 'temp-high', value: tempC, threshold: thresholds.highTempC, at });
      } else if (tempC <= thresholds.lowTempC) {
        triggers.push({ type: 'temp-low', value: tempC, threshold: thresholds.lowTempC, at });
      }
    }

    if (rain3h >= thresholds.heavyRainMm3h) {
      triggers.push({ type: 'rain', value: rain3h, threshold: thresholds.heavyRainMm3h, at });
    }

    if (windMs >= thresholds.highWindMs) {
      triggers.push({ type: 'wind', value: windMs, threshold: thresholds.highWindMs, at });
    }
  }

  return triggers;
}
