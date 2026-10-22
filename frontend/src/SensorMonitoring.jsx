import { useEffect, useState } from "react";
import axios from "axios";

import {
  Thermometer,
  Droplets,
  Weight,
  Cpu,
  RefreshCw,
  ArrowLeft,
  Activity,
  Cloud,
  Radio,
  Gauge,
  Cable,
  BarChart3,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import "./App.css";

const API = "http://localhost:5000";

function SensorMonitoring({ onBack }) {

  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Which sensor graph is selected
  const [selectedSensor, setSelectedSensor] =
    useState("temperature");


  // =====================================================
  // LOAD SENSOR DATA
  // =====================================================

  const loadData = async () => {

    try {

      setLoading(true);

      const [
        latestResponse,
        historyResponse
      ] = await Promise.all([

        axios.get(
          `${API}/api/cement-data`
        ),

        axios.get(
          `${API}/api/cement-history`
        )

      ]);

      setData(
        latestResponse.data
      );

      setHistory(
        historyResponse.data
      );

    } catch (error) {

      console.error(
        "Sensor monitoring error:",
        error
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    loadData();

    const interval =
      setInterval(
        loadData,
        20000
      );

    return () =>
      clearInterval(interval);

  }, []);


  // =====================================================
  // CURRENT VALUES
  // =====================================================

  const temperature =
    data?.temperature ?? "--";

  const humidity =
    data?.humidity ?? "--";

  const load =
    data?.load ?? "--";

  const status =
    data?.status || "CONNECTING";


  const lastUpdated =
    data?.timestamp
      ? new Date(
          data.timestamp
        ).toLocaleString()
      : "--";


  // =====================================================
  // GRAPH CONFIGURATION
  // =====================================================

  const graphConfig = {

    temperature: {
      title: "Temperature History",
      description:
        "Historical temperature readings from the DHT22 sensor",
      dataKey: "temperature",
      label: "Temperature",
      unit: "°C",
      icon: Thermometer,
      colorClass: "blue"
    },

    humidity: {
      title: "Humidity History",
      description:
        "Historical humidity readings from the DHT22 sensor",
      dataKey: "humidity",
      label: "Humidity",
      unit: "%",
      icon: Droplets,
      colorClass: "cyan"
    },

    load: {
      title: "Load Sensor History",
      description:
        "Historical raw load readings from the HX711 interface",
      dataKey: "load",
      label: "Load Raw",
      unit: "",
      icon: Weight,
      colorClass: "orange"
    }

  };


  const selected =
    graphConfig[selectedSensor];


  const SelectedIcon =
    selected.icon;


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="technical-monitor-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="technical-header">

        <div className="technical-title">

          <div className="technical-title-icon">

            <Radio size={22} />

          </div>

          <div>

            <div className="technical-kicker">
              SENSOR CONTROL CENTER
            </div>

            <h1>
              Sensor Monitoring
            </h1>

            <p>
              Live hardware telemetry and diagnostic information
            </p>

          </div>

        </div>


        <div className="technical-actions">

          <button
            className="tech-back-button"
            onClick={onBack}
          >

            <ArrowLeft size={16} />

            Dashboard

          </button>


          <button
            className="tech-refresh-button"
            onClick={loadData}
          >

            <RefreshCw size={16} />

            {loading
              ? "Updating..."
              : "Refresh"}

          </button>

        </div>

      </div>



      {/* =================================================
          LIVE TELEMETRY
      ================================================= */}

      <section className="telemetry-panel">

        <div className="telemetry-heading">

          <div>

            <span>
              LIVE TELEMETRY
            </span>

            <h2>
              Select a sensor to view its history
            </h2>

          </div>


          <div className="telemetry-live">

            <span></span>

            LIVE

          </div>

        </div>


        <div className="telemetry-row">


          {/* TEMPERATURE */}

          <button
            className={`telemetry-item telemetry-clickable ${
              selectedSensor === "temperature"
                ? "telemetry-selected"
                : ""
            }`}
            onClick={() =>
              setSelectedSensor(
                "temperature"
              )
            }
          >

            <div className="telemetry-icon blue">

              <Thermometer size={20} />

            </div>


            <div>

              <span>
                TEMPERATURE
              </span>

              <strong>

                {temperature}

                <small>
                  °C
                </small>

              </strong>

            </div>


            <div className="telemetry-source">
              DHT22
            </div>

          </button>



          {/* HUMIDITY */}

          <button
            className={`telemetry-item telemetry-clickable ${
              selectedSensor === "humidity"
                ? "telemetry-selected"
                : ""
            }`}
            onClick={() =>
              setSelectedSensor(
                "humidity"
              )
            }
          >

            <div className="telemetry-icon cyan">

              <Droplets size={20} />

            </div>


            <div>

              <span>
                HUMIDITY
              </span>

              <strong>

                {humidity}

                <small>
                  %
                </small>

              </strong>

            </div>


            <div className="telemetry-source">
              DHT22
            </div>

          </button>



          {/* LOAD */}

          <button
            className={`telemetry-item telemetry-clickable ${
              selectedSensor === "load"
                ? "telemetry-selected"
                : ""
            }`}
            onClick={() =>
              setSelectedSensor(
                "load"
              )
            }
          >

            <div className="telemetry-icon orange">

              <Weight size={20} />

            </div>


            <div>

              <span>
                LOAD RAW
              </span>

              <strong>
                {load}
              </strong>

            </div>


            <div className="telemetry-source">
              HX711
            </div>

          </button>



          {/* CONDITION */}

          <div className="telemetry-item condition-item">

            <div className="telemetry-icon green">

              <Activity size={20} />

            </div>


            <div>

              <span>
                CONDITION
              </span>

              <strong className="condition-value">
                {status}
              </strong>

            </div>


            <div className="condition-dot">

              <span></span>

            </div>

          </div>

        </div>

      </section>



      {/* =================================================
          SELECTED SENSOR GRAPH
      ================================================= */}

      <section className="sensor-graph-panel">

        <div className="sensor-graph-header">

          <div className="sensor-graph-title">

            <div
              className={`sensor-graph-icon ${selected.colorClass}`}
            >

              <SelectedIcon size={21} />

            </div>


            <div>

              <div className="graph-kicker">
                SENSOR HISTORY
              </div>

              <h2>
                {selected.title}
              </h2>

              <p>
                {selected.description}
              </p>

            </div>

          </div>


          <div className="graph-current-value">

            <span>
              CURRENT
            </span>

            <strong>

              {selectedSensor === "temperature"
                ? temperature
                : selectedSensor === "humidity"
                ? humidity
                : load}

              {selected.unit && (
                <small>
                  {selected.unit}
                </small>
              )}

            </strong>

          </div>

        </div>


        <div className="sensor-graph">

          {history.length > 0 ? (

            <ResponsiveContainer
              width="100%"
              height={330}
            >

              <LineChart
                data={history}
                margin={{
                  top: 10,
                  right: 20,
                  left: 5,
                  bottom: 10
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e7edf3"
                />

                <XAxis
                  dataKey="time"
                  tick={{
                    fontSize: 10,
                    fill: "#7b899b"
                  }}
                  tickLine={false}
                  axisLine={{
                    stroke: "#dce3ea"
                  }}
                />

                <YAxis
                  tick={{
                    fontSize: 10,
                    fill: "#7b899b"
                  }}
                  tickLine={false}
                  axisLine={{
                    stroke: "#dce3ea"
                  }}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #dce3ea",
                    fontSize: "12px"
                  }}
                  formatter={(value) => [
                    `${value}${selected.unit}`,
                    selected.label
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey={
                    selected.dataKey
                  }
                  name={
                    selected.label
                  }
                  stroke={
                    selectedSensor ===
                    "temperature"
                      ? "#2878e8"
                      : selectedSensor ===
                        "humidity"
                      ? "#0891b2"
                      : "#e86f16"
                  }
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    r: 5
                  }}
                />

              </LineChart>

            </ResponsiveContainer>

          ) : (

            <div className="graph-empty">

              <BarChart3 size={30} />

              <strong>
                No historical data available
              </strong>

              <span>
                Waiting for sensor readings from ThingSpeak
              </span>

            </div>

          )}

        </div>


        <div className="graph-footer">

          <span>
            Showing {history.length} recorded readings
          </span>

          <span>
            Source: ThingSpeak Cloud
          </span>

        </div>

      </section>



      {/* =================================================
          SENSOR MATRIX + THRESHOLD
      ================================================= */}

      <div className="technical-grid">


        {/* SENSOR MATRIX */}

        <section className="sensor-matrix-panel">

          <div className="tech-panel-heading">

            <div>

              <span>
                HARDWARE
              </span>

              <h2>
                Sensor Matrix
              </h2>

            </div>

            <Activity size={19} />

          </div>


          <div className="matrix-table">


            <div className="matrix-row matrix-header">

              <span>
                DEVICE
              </span>

              <span>
                INTERFACE
              </span>

              <span>
                PIN
              </span>

              <span>
                HEALTH
              </span>

            </div>


            {/* DHT22 */}

            <div className="matrix-row">

              <div className="matrix-device">

                <div className="matrix-icon blue">
                  <Thermometer size={17} />
                </div>

                <div>

                  <strong>
                    DHT22
                  </strong>

                  <small>
                    Temp / Humidity
                  </small>

                </div>

              </div>

              <span>
                Digital
              </span>

              <code>
                GPIO 4
              </code>

              <div className="matrix-health">

                <span></span>

                Active

              </div>

            </div>


            {/* HX711 */}

            <div className="matrix-row">

              <div className="matrix-device">

                <div className="matrix-icon orange">
                  <Weight size={17} />
                </div>

                <div>

                  <strong>
                    HX711
                  </strong>

                  <small>
                    Load interface
                  </small>

                </div>

              </div>

              <span>
                Digital
              </span>

              <code>
                26 / 27
              </code>

              <div className="matrix-health">

                <span></span>

                Active

              </div>

            </div>


            {/* OLED */}

            <div className="matrix-row">

              <div className="matrix-device">

                <div className="matrix-icon purple">
                  <Gauge size={17} />
                </div>

                <div>

                  <strong>
                    OLED
                  </strong>

                  <small>
                    Local display
                  </small>

                </div>

              </div>

              <span>
                I²C
              </span>

              <code>
                21 / 22
              </code>

              <div className="matrix-health">

                <span></span>

                Active

              </div>

            </div>


            {/* ESP32 */}

            <div className="matrix-row">

              <div className="matrix-device">

                <div className="matrix-icon dark">
                  <Cpu size={17} />
                </div>

                <div>

                  <strong>
                    ESP32
                  </strong>

                  <small>
                    Main controller
                  </small>

                </div>

              </div>

              <span>
                Wi-Fi
              </span>

              <code>
                Controller
              </code>

              <div className="matrix-health">

                <span></span>

                Online

              </div>

            </div>

          </div>

        </section>



        {/* THRESHOLD */}

        <section className="threshold-panel">

          <div className="tech-panel-heading">

            <div>

              <span>
                CONDITION LOGIC
              </span>

              <h2>
                Humidity Threshold
              </h2>

            </div>

            <Droplets size={19} />

          </div>


          <div className="threshold-value">

            <strong>
              {humidity}
            </strong>

            <span>
              %
            </span>

          </div>


          <p className="threshold-description">

            Current relative humidity compared with
            the configured monitoring limits.

          </p>


          <div className="threshold-scale">

            <div className="scale-track">

              <div
                className="scale-marker"
                style={{
                  left: `${Math.min(
                    Number(humidity) || 0,
                    100
                  )}%`
                }}
              ></div>

            </div>


            <div className="scale-labels">

              <span>
                0%
              </span>

              <span>
                75%
              </span>

              <span>
                80%
              </span>

              <span>
                100%
              </span>

            </div>

          </div>


          <div className="threshold-states">

            <div>

              <span className="state-dot normal-dot"></span>

              <div>

                <strong>
                  NORMAL
                </strong>

                <small>
                  Below 75%
                </small>

              </div>

            </div>


            <div>

              <span className="state-dot warning-dot"></span>

              <div>

                <strong>
                  WARNING
                </strong>

                <small>
                  75% – 80%
                </small>

              </div>

            </div>


            <div>

              <span className="state-dot danger-dot"></span>

              <div>

                <strong>
                  DANGER
                </strong>

                <small>
                  Above 80%
                </small>

              </div>

            </div>

          </div>

        </section>

      </div>



      {/* =================================================
          SIGNAL FLOW
      ================================================= */}

      <section className="signal-flow-panel">

        <div className="tech-panel-heading">

          <div>

            <span>
              SYSTEM COMMUNICATION
            </span>

            <h2>
              Hardware Signal Flow
            </h2>

          </div>

          <Cable size={19} />

        </div>


        <div className="signal-flow">


          <div className="flow-node">

            <div className="flow-icon blue">
              <Thermometer size={20} />
            </div>

            <strong>
              DHT22
            </strong>

            <small>
              Temperature
              <br />
              Humidity
            </small>

          </div>


          <div className="flow-line">
            <span></span>
          </div>


          <div className="flow-node">

            <div className="flow-icon orange">
              <Weight size={20} />
            </div>

            <strong>
              HX711
            </strong>

            <small>
              Load Cell
              <br />
              Interface
            </small>

          </div>


          <div className="flow-line">
            <span></span>
          </div>


          <div className="flow-node">

            <div className="flow-icon dark">
              <Cpu size={20} />
            </div>

            <strong>
              ESP32
            </strong>

            <small>
              Data Processing
              <br />
              Wi-Fi
            </small>

          </div>


          <div className="flow-line">
            <span></span>
          </div>


          <div className="flow-node">

            <div className="flow-icon purple">
              <Cloud size={20} />
            </div>

            <strong>
              ThingSpeak
            </strong>

            <small>
              Cloud Storage
              <br />
              Historical Data
            </small>

          </div>

        </div>

      </section>



      {/* =================================================
          DEVICE INFORMATION
      ================================================= */}

      <section className="diagnostics-panel">

        <div className="tech-panel-heading">

          <div>

            <span>
              DIAGNOSTICS
            </span>

            <h2>
              Device Information
            </h2>

          </div>

          <Cpu size={19} />

        </div>


        <div className="diagnostics-grid">

          <div className="diagnostic-item">

            <span>
              CONTROLLER
            </span>

            <strong>
              ESP32 DevKit
            </strong>

          </div>


          <div className="diagnostic-item">

            <span>
              COMMUNICATION
            </span>

            <strong>
              Wi-Fi / HTTP
            </strong>

          </div>


          <div className="diagnostic-item">

            <span>
              CLOUD
            </span>

            <strong>
              ThingSpeak
            </strong>

          </div>


          <div className="diagnostic-item">

            <span>
              UPDATE INTERVAL
            </span>

            <strong>
              20 seconds
            </strong>

          </div>


          <div className="diagnostic-item">

            <span>
              LAST UPDATE
            </span>

            <strong>
              {lastUpdated}
            </strong>

          </div>


          <div className="diagnostic-item">

            <span>
              NETWORK STATUS
            </span>

            <strong className="diagnostic-online">

              <span></span>

              Connected

            </strong>

          </div>

        </div>

      </section>



      <div className="technical-footer">

        <span>
          CementGuard Sensor Control Center
        </span>

        <span>
          ESP32 • DHT22 • HX711 • ThingSpeak
        </span>

      </div>

    </div>

  );

}

export default SensorMonitoring;