import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  fetchWeather,
  processForecast,
  formatDayLabel,
  buildInsights,
} from "./weatherUtils.js";
import "./App.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_KEY = e774c6dc39bc4df1cc2a6eb89c44ef80;

export default function App() {
  const [cityInput, setCityInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);

  const daily = useMemo(
    () => (payload ? processForecast(payload) : []),
    [payload]
  );

  const chartSlice = useMemo(() => daily.slice(0, 7), [daily]);
  const insights = useMemo(() => buildInsights(daily), [daily]);

  const current = payload?.list?.[0];
  const displayCity = payload?.city?.name ?? cityInput;

  async function handleSearch(e) {
    e.preventDefault();
    setError(null);
    if (!cityInput.trim()) {
      setError("Please enter a city name.");
      return;
    }
    if (!API_KEY) {
      setError(
        "Missing API key. Add VITE_OPENWEATHER_API_KEY to a .env file (see .env.example)."
      );
      return;
    }
    setLoading(true);
    try {
      const data = await fetchWeather(cityInput, API_KEY);
      setPayload(data);
    } catch (err) {
      console.error("Error fetching weather:", err);
      setError(err.message || "Something went wrong");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }

  const chartData = {
    labels: chartSlice.map((d) => formatDayLabel(d.date)),
    datasets: [
      {
        label: "Temperature (°C)",
        data: chartSlice.map((d) => Number(d.temp.toFixed(1))),
        borderColor: "rgb(14, 165, 233)",
        backgroundColor: "rgba(14, 165, 233, 0.15)",
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" },
      title: {
        display: true,
        text: "Temperature trend (daily average)",
        font: { size: 16, weight: "600" },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Date" },
        grid: { display: false },
      },
      y: {
        title: { display: true, text: "Temperature (°C)" },
        beginAtZero: false,
      },
    },
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Weather Trend Planner</h1>
        <p className="tagline">
          Analyze forecast trends and pick a good day for outdoor plans.
        </p>
      </header>

      <form className="search" onSubmit={handleSearch}>
        <label htmlFor="city">Enter city:</label>
        <input
          id="city"
          type="text"
          placeholder="e.g. London"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          autoComplete="off"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Loading…" : "Search"}
        </button>
      </form>

      {error && <p className="error" role="alert">{error}</p>}

      {payload && current && (
        <section className="card current">
          <h2>Current conditions</h2>
          <dl className="stats">
            <div>
              <dt>City</dt>
              <dd>{displayCity}</dd>
            </div>
            <div>
              <dt>Temperature</dt>
              <dd>{Math.round(current.main.temp)}°C</dd>
            </div>
            <div>
              <dt>Condition</dt>
              <dd className="capitalize">
                {current.weather?.[0]?.description ?? "—"}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {chartSlice.length > 0 && (
        <section className="card chart-card">
          <div className="chart-wrap">
            <Line data={chartData} options={chartOptions} />
          </div>
        </section>
      )}

      {insights.length > 0 && (
        <section className="card insights">
          <h2>Insights</h2>
          <ul>
            {insights.map((item, i) => (
              <li key={i} className={`insight insight--${item.type}`}>
                {item.text}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
