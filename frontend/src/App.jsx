
import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import {
  LayoutDashboard,
  Thermometer,
  Droplets,
  Weight,
  Activity,
  RefreshCw,
  Cloud,
  Cpu,
  LogOut,
  Menu,
  ShieldCheck,
  Clock3,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import CloudData from "./CloudData";
import SensorMonitoring from "./SensorMonitoring";
import "./App.css";

const API = "https://cement-stack-monitoring.onrender.com";

// =====================================================
// LOGIN PAGE
// =====================================================

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (event) => {
    event.preventDefault();

    if (username === "admin" && password === "admin123") {
      localStorage.setItem("cementLoggedIn", "true");
      onLogin();
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="brand-logo">
            <Activity size={26} />
          </div>

          <div>
            <h2>CementGuard</h2>
            <span>IoT Monitoring Platform</span>
          </div>
        </div>

        <div className="login-content">
          <div className="login-icon">
            <ShieldCheck size={42} />
          </div>

          <h1>
            Cement Stack
            <br />
            Condition Monitoring
          </h1>

          <p>
            Real-time monitoring of temperature, humidity and
            stack load conditions using IoT technology.
          </p>

          <div className="login-features">
            <div><span>✓</span> Real-time sensor monitoring</div>
            <div><span>✓</span> Cloud-based data storage</div>
            <div><span>✓</span> Condition alerts</div>
          </div>
        </div>

        <div className="login-footer">
          © 2026 CementGuard IoT Monitoring
        </div>
      </div>

      <div className="login-right">
        <form className="login-box" onSubmit={handleLogin}>
          <div className="mobile-logo">
            <Activity size={30} />
          </div>

          <h2>Welcome Back</h2>
          <p>Sign in to access your monitoring dashboard</p>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <label htmlFor="login-username">Username</label>
          <input
            id="login-username"
            type="text"
            placeholder="Enter username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            placeholder="Enter password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button type="submit" className="login-button">
            Sign In
          </button>

          <div className="demo-login">
            <strong>Demo credentials</strong>
            <span>Username: admin</span>
            <span>Password: admin123</span>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================
// DASHBOARD
// =====================================================

function Dashboard({ onLogout }) {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  // Fetch latest data and historical records.
  const loadDashboard = useCallback(async () => {
    try {
      const latestResponse = await axios.get(
        `${API}/api/cement-data`,
        { timeout: 10000 }
      );

      setData(latestResponse.data);
      setBackendOnline(true);
      setLastChecked(new Date());

      // History is useful for the dashboard chart.
      try {
        const historyResponse = await axios.get(
          `${API}/api/cement-history`,
          { timeout: 20000 }
        );

        if (Array.isArray(historyResponse.data)) {
          setHistory(historyResponse.data);
        }
      } catch (historyError) {
        console.error("History request failed:", historyError.message);
      }
    } catch (error) {
      console.error("Dashboard request failed:", error.message);
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(loadDashboard, 20000);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  const status = backendOnline
    ? data?.status || "CONNECTING"
    : "OFFLINE";

  const statusClass =
    status === "DANGER"
      ? "danger"
      : status === "WARNING"
      ? "warning"
      : status === "NORMAL"
      ? "normal"
      : "connecting";

  const formatTime = (value) => {
    if (!value) return "--";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "--"
      : date.toLocaleString();
  };

  const openSensorPage = () => {
    setCurrentPage("sensor");
    setMobileMenu(false);
  };

  const openCloudPage = () => {
    setCurrentPage("cloud");
    setMobileMenu(false);
  };

  // Prepare separate, readable graph datasets.
  const chartData = [...history]
    .filter(
      (item) =>
        item.time &&
        (
          Number.isFinite(Number(item.temperature)) ||
          Number.isFinite(Number(item.humidity))
        )
    )
    .sort(
      (a, b) => new Date(a.time) - new Date(b.time)
    )
    .slice(-100)
    .map((item) => ({
      ...item,
      chartTime: new Date(item.time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      temperature:
        item.temperature == null ? null : Number(item.temperature),
      humidity:
        item.humidity == null ? null : Number(item.humidity),
    }));

  const loadChartData = [...history]
    .filter(
      (item) =>
        item.time &&
        item.load != null &&
        Number.isFinite(Number(item.load))
    )
    .sort(
      (a, b) => new Date(a.time) - new Date(b.time)
    )
    .slice(-100)
    .map((item) => ({
      ...item,
      chartTime: new Date(item.time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      load: Number(item.load),
    }));

  // ===================================================
  // SIDEBAR
  // ===================================================

  const Sidebar = () => (
    <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand">
        <div className="brand-logo">
          <Activity size={23} />
        </div>

        <div>
          <strong>CementGuard</strong>
          <span>IoT Platform</span>
        </div>
      </div>

      <nav>
        <div className="nav-section">MAIN</div>

        <button
          type="button"
          className={`nav-item ${currentPage === "dashboard" ? "active" : ""}`}
          onClick={() => {
            setCurrentPage("dashboard");
            setMobileMenu(false);
          }}
        >
          <LayoutDashboard size={19} />
          Dashboard
        </button>

        <button
          type="button"
          className={`nav-item ${currentPage === "sensor" ? "active" : ""}`}
          onClick={openSensorPage}
        >
          <Activity size={19} />
          Sensor Monitoring
        </button>

        <button
          type="button"
          className={`nav-item ${currentPage === "cloud" ? "active" : ""}`}
          onClick={openCloudPage}
        >
          <Cloud size={19} />
          Cloud Data
        </button>
      </nav>

      <div className="sidebar-bottom">
        <div className="user-profile">
          <div className="avatar">A</div>

          <div>
            <strong>Administrator</strong>
            <span>System Admin</span>
          </div>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={onLogout}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );

  // ===================================================
  // SENSOR CARD
  // ===================================================

  const SensorCard = ({
    title,
    value,
    unit,
    description,
    icon: Icon,
    color,
    onClick,
  }) => (
    <button
      type="button"
      className="sensor-card sensor-card-clickable"
      onClick={onClick}
      title={`Open ${title} monitoring`}
    >
      <div className="sensor-card-top">
        <div className={`sensor-icon ${color}`}>
          <Icon size={24} />
        </div>

        <span className={`sensor-live ${backendOnline ? "" : "sensor-offline"}`}>
          {backendOnline ? "LIVE" : "OFFLINE"}
        </span>
      </div>

      <span className="sensor-name">{title}</span>

      <div className="sensor-value">
        {loading ? "--" : value ?? "--"}
        {unit && <small>{unit}</small>}
      </div>

      <p>{description}</p>
      <span className="sensor-card-hint">View sensor details →</span>
    </button>
  );

  // ===================================================
  // DASHBOARD PAGE
  // ===================================================

  const DashboardPage = () => (
    <>
      <header className="topbar">
        <button
          type="button"
          className="mobile-menu"
          onClick={() => setMobileMenu((value) => !value)}
          aria-label="Toggle navigation"
        >
          <Menu size={22} />
        </button>

        <div>
          <h1>Monitoring Dashboard</h1>
          <p>Real-time cement storage condition monitoring</p>
        </div>

        <div className="topbar-right">
          <div className={`online-status ${backendOnline ? "" : "offline"}`}>
            {backendOnline ? <Wifi size={15} /> : <WifiOff size={15} />}
            {backendOnline ? "Backend Connected" : "Backend Offline"}
          </div>

          <div className="topbar-date">
            <Clock3 size={16} />
            {lastChecked
              ? `Updated ${lastChecked.toLocaleTimeString()}`
              : "Waiting for data"}
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <section className={`main-status ${statusClass}`}>
          <div className="status-icon">
            {status === "DANGER" ? (
              <AlertTriangle size={28} />
            ) : status === "NORMAL" ? (
              <CheckCircle2 size={28} />
            ) : (
              <Activity size={28} />
            )}
          </div>

          <div className="status-text">
            <span className="status-label">CURRENT SYSTEM CONDITION</span>

            <h2>{status}</h2>

            <p>
              {status === "OFFLINE"
                ? "The backend cannot be reached. Check the server."
                : status === "DANGER"
                ? "Humidity exceeds the configured danger threshold. Inspect storage conditions."
                : status === "WARNING"
                ? "Humidity has reached the warning range. Inspect storage conditions."
                : status === "NORMAL"
                ? "The latest humidity reading is below the warning threshold."
                : "Waiting for sensor data from ESP32 and ThingSpeak."}
            </p>
          </div>

          <div className="status-time">
            <span>LAST SENSOR UPDATE</span>
            <strong>{formatTime(data?.timestamp)}</strong>
          </div>
        </section>

        <section className="sensor-grid">
          <SensorCard
            title="Temperature"
            value={data?.temperature}
            unit="°C"
            description="Ambient storage temperature"
            icon={Thermometer}
            color="blue"
            onClick={openSensorPage}
          />

          <SensorCard
            title="Humidity"
            value={data?.humidity}
            unit="%"
            description="Relative humidity level"
            icon={Droplets}
            color="cyan"
            onClick={openSensorPage}
          />

          <SensorCard
            title="Stack Load"
            value={data?.load}
            description="Raw HX711 reading unless calibrated"
            icon={Weight}
            color="orange"
            onClick={openSensorPage}
          />
        </section>

        <section className="dashboard-grid">
          <div className="panel chart-panel">
            <div className="panel-header">
              <div>
                <h2>Environmental History</h2>
                <p>Temperature and humidity over time</p>
              </div>

              <button
                type="button"
                className="refresh-btn"
                onClick={loadDashboard}
                disabled={loading}
              >
                <RefreshCw size={17} />
                Refresh
              </button>
            </div>

            <div className="chart-container">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5eaf1"
                    />

                    <XAxis
                      dataKey="chartTime"
                      tick={{ fontSize: 10 }}
                      minTickGap={25}
                    />

                    <YAxis
                      yAxisId="temperature"
                      tick={{ fontSize: 11 }}
                      width={42}
                    />

                    <YAxis
                      yAxisId="humidity"
                      orientation="right"
                      domain={[0, 100]}
                      tick={{ fontSize: 11 }}
                      width={42}
                    />

                    <Tooltip />
                    <Legend />

                    <Line
                      yAxisId="temperature"
                      type="monotone"
                      dataKey="temperature"
                      name="Temperature °C"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={false}
                      connectNulls={false}
                    />

                    <Line
                      yAxisId="humidity"
                      type="monotone"
                      dataKey="humidity"
                      name="Humidity %"
                      stroke="#0891b2"
                      strokeWidth={2.5}
                      dot={false}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data">
                  {loading
                    ? "Loading environmental history..."
                    : "No historical data available"}
                </div>
              )}
            </div>
          </div>

          <div className="panel system-panel">
            <div className="panel-header">
              <div>
                <h2>System Status</h2>
                <p>Monitoring components</p>
              </div>
            </div>

            <div className="system-list">
              <div className="system-row">
                <div className="system-row-icon">
                  <Cpu size={19} />
                </div>
                <div>
                  <strong>ESP32 Controller</strong>
                  <span>Main controller</span>
                </div>
                <b className={backendOnline ? "" : "system-offline"}>
                  {backendOnline ? "API OK" : "Offline"}
                </b>
              </div>

              <div className="system-row">
                <div className="system-row-icon">
                  <Thermometer size={19} />
                </div>
                <div>
                  <strong>DHT22 Sensor</strong>
                  <span>Temperature / Humidity</span>
                </div>
                <b>{data ? "Data received" : "Waiting"}</b>
              </div>

              <div className="system-row">
                <div className="system-row-icon">
                  <Weight size={19} />
                </div>
                <div>
                  <strong>HX711 + Load Cell</strong>
                  <span>Load monitoring</span>
                </div>
                <b>{data?.load != null ? "Data received" : "Waiting"}</b>
              </div>

              <div className="system-row">
                <div className="system-row-icon">
                  <Cloud size={19} />
                </div>
                <div>
                  <strong>ThingSpeak Cloud</strong>
                  <span>Sensor data endpoint</span>
                </div>
                <b>{backendOnline && data ? "Data received" : "Unknown"}</b>
              </div>
            </div>

            <button
              type="button"
              className="page-button secondary"
              onClick={openCloudPage}
            >
              <Cloud size={16} />
              View Cloud Records
            </button>
          </div>
        </section>

        <section className="panel information-panel">
          <div className="panel-header">
            <div>
              <h2>Monitoring Information</h2>
              <p>System configuration and communication details</p>
            </div>
          </div>

          <div className="information-grid">
            <div>
              <span>Monitoring Device</span>
              <strong>ESP32 DevKit</strong>
            </div>

            <div>
              <span>Cloud Platform</span>
              <strong>ThingSpeak</strong>
            </div>

            <div>
              <span>Data Refresh</span>
              <strong>20 seconds</strong>
            </div>

            <div>
              <span>Communication</span>
              <strong>Wi-Fi / HTTP</strong>
            </div>

            <div>
              <span>Temperature Sensor</span>
              <strong>DHT22</strong>
            </div>

            <div>
              <span>Load Interface</span>
              <strong>HX711</strong>
            </div>
          </div>
        </section>

        <section className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h2>Load Sensor History</h2>
              <p>Raw HX711 readings — not kilograms until calibrated</p>
            </div>
          </div>

          <div className="chart-container">
            {loadChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={loadChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5eaf1"
                  />

                  <XAxis
                    dataKey="chartTime"
                    tick={{ fontSize: 10 }}
                    minTickGap={25}
                  />

                  <YAxis
                    tick={{ fontSize: 11 }}
                    width={65}
                  />

                  <Tooltip />
                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="load"
                    name="Raw load reading"
                    stroke="#ea580c"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">
                No load history available
              </div>
            )}
          </div>
        </section>

        <footer className="dashboard-footer">
          <span>CementGuard IoT Monitoring Platform</span>
          <span>ESP32 · DHT22 · HX711 · ThingSpeak</span>
        </footer>
      </div>
    </>
  );

  // ===================================================
  // MAIN RETURN
  // ===================================================

  return (
    <div className="dashboard-layout">
      <Sidebar />

      {mobileMenu && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <main className="dashboard-main">
        {currentPage === "dashboard" && <DashboardPage />}

        {currentPage === "sensor" && (
          <SensorMonitoring
            onBack={() => setCurrentPage("dashboard")}
          />
        )}

        {currentPage === "cloud" && (
          <CloudData
            onBack={() => setCurrentPage("dashboard")}
          />
        )}
      </main>
    </div>
  );
}

// =====================================================
// APP
// =====================================================

function App() {
  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem("cementLoggedIn") === "true"
  );

  const handleLogout = () => {
    localStorage.removeItem("cementLoggedIn");
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return <Dashboard onLogout={handleLogout} />;
}

export default App;
