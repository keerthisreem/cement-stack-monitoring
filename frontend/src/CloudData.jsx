
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Cloud,
  RefreshCw,
  ArrowLeft,
  Thermometer,
  Droplets,
  Weight,
  Database,
  Clock3,
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Radio,
} from "lucide-react";
import "./App.css";

const API = "https://cement-stack-monitoring.onrender.com";

function getStatus(humidity) {
  const value = Number(humidity);

  if (!Number.isFinite(value)) return "UNKNOWN";
  if (value > 80) return "DANGER";
  if (value >= 75) return "WARNING";
  return "NORMAL";
}

function formatDate(value) {
  if (!value) return "--";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "--"
    : date.toLocaleString();
}

function CloudData({ onBack }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${API}/api/cement-history`,
        { timeout: 25000 }
      );

      if (!Array.isArray(response.data)) {
        throw new Error("Unexpected cloud data format");
      }

      setHistory(response.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Cloud data error:", err);
      setError(
        "Unable to load ThingSpeak records. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const latest = history.length
    ? history[history.length - 1]
    : null;

  const normalCount = history.filter(
    (item) => getStatus(item.humidity) === "NORMAL"
  ).length;

  const warningCount = history.filter(
    (item) => getStatus(item.humidity) === "WARNING"
  ).length;

  const dangerCount = history.filter(
    (item) => getStatus(item.humidity) === "DANGER"
  ).length;

  const filteredHistory = history
    .filter((item) => {
      const status = item.status || getStatus(item.humidity);
      const text = [
        item.time,
        item.temperature,
        item.humidity,
        item.load,
        status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = text.includes(
        search.toLowerCase()
      );

      const matchesStatus =
        statusFilter === "ALL" ||
        status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .slice()
    .reverse();

  const exportCSV = () => {
    if (!filteredHistory.length) return;

    const rows = [
      ["Date & Time", "Temperature (C)", "Humidity (%)", "Load Reading", "Status"],
      ...filteredHistory.map((item) => [
        formatDate(item.time),
        item.temperature ?? "",
        item.humidity ?? "",
        item.load ?? "",
        item.status || getStatus(item.humidity),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) =>
            `"${String(value).replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "cementguard-cloud-history.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <main className="cloudx-page">
      <header className="cloudx-header">
        <div className="cloudx-heading">
          <div className="cloudx-heading-icon">
            <Cloud size={25} />
          </div>

          <div>
            <div className="cloudx-eyebrow">
              CEMENTGUARD / DATA CENTER
            </div>
            <h1>Cloud Data</h1>
            <p>
              Historical sensor records stored in ThingSpeak.
            </p>
          </div>
        </div>

        <div className="cloudx-actions">
          <button
            className="cloudx-button cloudx-button-light"
            onClick={onBack}
          >
            <ArrowLeft size={17} />
            Dashboard
          </button>

          <button
            className="cloudx-button cloudx-button-primary"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={loading ? "cloudx-spinning" : ""}
            />
            {loading ? "Loading..." : "Refresh data"}
          </button>
        </div>
      </header>

      <section className="cloudx-connection">
        <div className="cloudx-connection-left">
          <span className="cloudx-cloud-symbol">
            <Radio size={19} />
          </span>

          <div>
            <strong>ThingSpeak Cloud Storage</strong>
            <p>
              Historical records retrieved through the CementGuard backend
            </p>
          </div>
        </div>

        <span className={`cloudx-connection-status ${error ? "offline" : ""}`}>
          <span />
          {error ? "Connection issue" : loading ? "Syncing data" : "API status OK"}
        </span>
      </section>

      {error && (
        <div className="cloudx-error" role="alert">
          <AlertTriangle size={19} />
          <span>{error}</span>
          <button onClick={loadData}>Retry</button>
        </div>
      )}

      <section className="cloudx-metrics">
        <article className="cloudx-metric">
          <div className="cloudx-metric-top">
            <span>Total records</span>
            <span className="cloudx-metric-icon purple">
              <Database size={20} />
            </span>
          </div>
          <strong>{history.length.toLocaleString()}</strong>
          <small>Retrieved from cloud history</small>
        </article>

        <article className="cloudx-metric">
          <div className="cloudx-metric-top">
            <span>Latest temperature</span>
            <span className="cloudx-metric-icon blue">
              <Thermometer size={20} />
            </span>
          </div>
          <strong>
            {latest?.temperature ?? "--"}
            <small className="cloudx-unit"> °C</small>
          </strong>
          <small>Most recent returned record</small>
        </article>

        <article className="cloudx-metric">
          <div className="cloudx-metric-top">
            <span>Latest humidity</span>
            <span className="cloudx-metric-icon cyan">
              <Droplets size={20} />
            </span>
          </div>
          <strong>
            {latest?.humidity ?? "--"}
            <small className="cloudx-unit"> %</small>
          </strong>
          <small>Project warning threshold: 75%</small>
        </article>

        <article className="cloudx-metric">
          <div className="cloudx-metric-top">
            <span>Latest load reading</span>
            <span className="cloudx-metric-icon orange">
              <Weight size={20} />
            </span>
          </div>
          <strong className="cloudx-load-value">
            {latest?.load ?? "--"}
          </strong>
          <small>Raw reading unless calibrated</small>
        </article>
      </section>

      <section className="cloudx-status-overview">
        <div className="cloudx-status-heading">
          <div>
            <span className="cloudx-eyebrow">RECORD OVERVIEW</span>
            <h2>Condition distribution</h2>
          </div>
          <span className="cloudx-record-total">
            {history.length} records
          </span>
        </div>

        <div className="cloudx-status-grid">
          <div className="cloudx-status-card normal">
            <CheckCircle2 size={21} />
            <div>
              <span>Normal records</span>
              <strong>{normalCount}</strong>
            </div>
          </div>

          <div className="cloudx-status-card warning">
            <AlertTriangle size={21} />
            <div>
              <span>Warning records</span>
              <strong>{warningCount}</strong>
            </div>
          </div>

          <div className="cloudx-status-card danger">
            <ShieldAlert size={21} />
            <div>
              <span>Danger records</span>
              <strong>{dangerCount}</strong>
            </div>
          </div>
        </div>

        <p className="cloudx-note">
          Status counts are calculated from the retrieved humidity readings
          using the current prototype thresholds. They do not directly detect
          cement hardening.
        </p>
      </section>

      <section className="cloudx-table-panel">
        <div className="cloudx-table-heading">
          <div>
            <span className="cloudx-eyebrow">CLOUD RECORDS</span>
            <h2>Sensor history</h2>
            <p>Search, filter and export the readings returned by ThingSpeak.</p>
          </div>

          <div className="cloudx-last-updated">
            <Clock3 size={15} />
            <span>
              Updated {lastUpdated ? lastUpdated.toLocaleTimeString() : "--"}
            </span>
          </div>
        </div>

        <div className="cloudx-toolbar">
          <label className="cloudx-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search readings or status..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <select
            className="cloudx-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter records by status"
          >
            <option value="ALL">All statuses</option>
            <option value="NORMAL">Normal</option>
            <option value="WARNING">Warning</option>
            <option value="DANGER">Danger</option>
            <option value="UNKNOWN">Unknown</option>
          </select>

          <button
            className="cloudx-button cloudx-button-light"
            onClick={exportCSV}
            disabled={!filteredHistory.length}
          >
            <Download size={17} />
            Export CSV
          </button>
        </div>

        {loading && history.length === 0 ? (
          <div className="cloudx-empty">
            <RefreshCw className="cloudx-spinning" size={27} />
            <strong>Loading cloud records</strong>
            <p>Fetching historical data from the backend...</p>
          </div>
        ) : error && history.length === 0 ? (
          <div className="cloudx-empty">
            <Cloud size={30} />
            <strong>Cloud data unavailable</strong>
            <p>Start the backend and try refreshing the records.</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="cloudx-empty">
            <Search size={28} />
            <strong>No matching records</strong>
            <p>Try changing the search text or status filter.</p>
          </div>
        ) : (
          <div className="cloudx-table-scroll">
            <table className="cloudx-table">
              <thead>
                <tr>
                  <th>NO.</th>
                  <th>DATE & TIME</th>
                  <th>TEMPERATURE</th>
                  <th>HUMIDITY</th>
                  <th>LOAD READING</th>
                  <th>CONDITION</th>
                </tr>
              </thead>

              <tbody>
                {filteredHistory.map((item, index) => {
                  const status = item.status || getStatus(item.humidity);

                  return (
                    <tr key={`${item.time || "record"}-${index}`}>
                      <td className="cloudx-index">
                        {index + 1}
                      </td>

                      <td>
                        <div className="cloudx-date">
                          {formatDate(item.time)}
                        </div>
                      </td>

                      <td>
                        <span className="cloudx-reading">
                          {item.temperature ?? "--"}
                          <small>°C</small>
                        </span>
                      </td>

                      <td>
                        <span className="cloudx-reading">
                          {item.humidity ?? "--"}
                          <small>%</small>
                        </span>
                      </td>

                      <td>
                        <span className="cloudx-load-reading">
                          {item.load ?? "--"}
                        </span>
                      </td>

                      <td>
                        <span className={`cloudx-badge ${status.toLowerCase()}`}>
                          <span />
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <footer className="cloudx-table-footer">
          <span>
            Showing {filteredHistory.length} of {history.length} records
          </span>
          <span>
            <Cloud size={15} />
            Source: ThingSpeak
          </span>
        </footer>
      </section>

      <footer className="cloudx-page-footer">
        <span>CementGuard · Industrial Sensor Monitoring</span>
        <span>
          <Database size={14} />
          Historical data view
        </span>
      </footer>
    </main>
  );
}

export default CloudData;
