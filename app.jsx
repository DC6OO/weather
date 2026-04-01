import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import "./App.css";

const API_KEY = "e774c6dc39bc4df1cc2a6eb89c44ef80";
export default function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState("");
  const [forecast, setForecast] = useState([]);
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchWeather = async () => {
    if (!city.trim()) {
      setError("Please enter a city name");
      return;
    }

    setLoading(true);
    setError("");
    setForecast([]);
    setInsight("");

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
      );

      if (!response.ok) {
        throw new Error("City not found");
      }

      const data = await response.json();

      setWeather(data.city.name);

      const processed = processForecast(data);
      setForecast(processed);

      generateInsight(processed);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processForecast = (data) => {
    const dailyTemps = {};

    data.list.forEach((item) => {
      const date = item.dt_txt.split(" ")[0];

      if (!dailyTemps[date]) {
        dailyTemps[date] = [];
      }

      dailyTemps[date].push(item.main.temp);
    });

    return Object.keys(dailyTemps).map((date) => {
      const temps = dailyTemps[date];
      const avg =
        temps.reduce((a, b) => a + b, 0) / temps.length;

      return {
        date,
        temp: Number(avg.toFixed(1))
      };
    });
  };

  const generateInsight = (data) => {
    const hottestDay = data.reduce((prev, curr) =>
      curr.temp > prev.temp ? curr : prev
    );

    const coldestDay = data.reduce((prev, curr) =>
      curr.temp < prev.temp ? curr : prev
    );

    let message = `Best day to go out: ${hottestDay.date} (${hottestDay.temp}°C)`;

    if (hottestDay.temp > 35) {
      message = `⚠ Heat warning on ${hottestDay.date}`;
    }

    if (coldestDay.temp < 5) {
      message += ` | ❄ Cold warning on ${coldestDay.date}`;
    }

    setInsight(message);
  };

  return (
    <div className="app">
      <div className="weather-card">
        <h1>Weather Trend Planner</h1>

        <div className="search-box">
          <input
            type="text"
            placeholder="Enter city name"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <button onClick={fetchWeather}>Search</button>
        </div>

        {loading && <p className="loading">Loading weather data...</p>}
        {error && <p className="error">{error}</p>}

        {weather && <h2>City: {weather}</h2>}

        {forecast.length > 0 && (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="temp" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {insight && <h3 className="insight">{insight}</h3>}
      </div>
    </div>
  );
}