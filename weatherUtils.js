const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

export async function fetchWeather(city, apiKey) {
  const q = encodeURIComponent(city.trim());
  const url = `${FORECAST_URL}?q=${q}&appid=${apiKey}&units=metric`;
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) throw new Error("City not found");
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to fetch weather");
  }
  return response.json();
}

/**
 * Convert 3-hour forecast slots into daily averages (per PDF spec).
 */
export function processForecast(data) {
  const dailyTemps = {};
  const dailyPop = {};

  data.list.forEach((item) => {
    const date = item.dt_txt.split(" ")[0];
    if (!dailyTemps[date]) {
      dailyTemps[date] = [];
      dailyPop[date] = [];
    }
    dailyTemps[date].push(item.main.temp);
    const pop = item.pop != null ? item.pop : 0;
    dailyPop[date].push(pop);
  });

  return Object.keys(dailyTemps)
    .map((date) => {
      const temps = dailyTemps[date];
      const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
      const pops = dailyPop[date];
      const avgPop = pops.reduce((a, b) => a + b, 0) / pops.length;
      return { date, temp: avgTemp, avgPop };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function formatDayLabel(isoDate) {
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function dayName(isoDate) {
  return new Date(isoDate + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "long",
  });
}

/**
 * Build insights: best outdoor day, rain warning, heat/cold warnings.
 */
export function buildInsights(daily) {
  const lines = [];
  if (!daily.length) return lines;

  const slice = daily.slice(0, 7);

  let best = slice[0];
  let bestScore = -Infinity;
  for (const day of slice) {
    let score = 0;
    if (day.avgPop < 0.35) score += 3;
    if (day.avgPop < 0.2) score += 1;
    if (day.temp >= 15 && day.temp <= 28) score += 2;
    if (day.temp >= 18 && day.temp <= 24) score += 2;
    score -= day.avgPop * 4;
    if (day.temp > 32) score -= 2;
    if (day.temp < 8) score -= 1;
    if (score > bestScore) {
      bestScore = score;
      best = day;
    }
  }

  lines.push({
    type: "info",
    text: `Best day to go out: ${dayName(best.date)} (${Math.round(best.temp)}°C)`,
  });

  for (const day of slice) {
    if (day.avgPop > 0.6) {
      lines.push({
        type: "rain",
        text: `Rain expected on ${dayName(day.date)}`,
      });
      break;
    }
  }

  for (const day of slice) {
    if (day.temp > 35) {
      lines.push({
        type: "heat",
        text: `Very hot day expected on ${dayName(day.date)} (${Math.round(day.temp)}°C)`,
      });
      break;
    }
  }

  for (const day of slice) {
    if (day.temp < 5) {
      lines.push({
        type: "cold",
        text: `Cold conditions on ${dayName(day.date)} (${Math.round(day.temp)}°C)`,
      });
      break;
    }
  }

  return lines;
}