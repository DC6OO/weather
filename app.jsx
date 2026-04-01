import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

const API_KEY = "YOUR_API_KEY";

export default function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [insight, setInsight] = useState("");

  const fetchWeather = async () => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
      );

      const data = await response.json();

      setWeather(data.city.name);

      const processed = processForecast(data);
      setForecast(processed);

      generateInsight(processed);
    } catch (error) {
      console.error(error);
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
        temp: avg.toFixed(1)
      };
    });
  };

  const generateInsight = (data) => {
    const bestDay = data.reduce((prev, curr) =>
      curr.temp > prev.temp ? curr : prev
    );

    let message = `Best day to go out: ${bestDay.date} (${bestDay.temp}°C)`;

    if (bestDay.temp > 35) {
      message = `Heat warning on ${bestDay.date}`;
    }

    if (bestDay.temp < 5) {
      message = `Cold warning on ${bestDay.date}`;
    }

    setInsight(message);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Weather Trend Planner</h1>

      <input
        type="text"
        placeholder="Enter city"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />

      <button onClick={fetchWeather}>Search</button>

      {weather && <h2>City: {weather}</h2>}

      {forecast.length > 0 && (
        <LineChart width={600} height={300} data={forecast}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="temp" />
        </LineChart>
      )}

      <h3>{insight}</h3>
    </div>
  );
}