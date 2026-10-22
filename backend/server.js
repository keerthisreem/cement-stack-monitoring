
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID;
const READ_API_KEY = process.env.THINGSPEAK_READ_API_KEY;

// Telegram alert configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Project thresholds: preliminary prototype values
const WARNING_LIMIT = 75;
const DANGER_LIMIT = 80;

// Monitor every 20 seconds
const MONITOR_INTERVAL = 20000;

// In-memory state; resets if the server restarts
let lastAlertStatus = null;
let lastObservedTimestamp = null;
let lastMonitorError = null;
let monitorBusy = false;

// ==========================================
// STATUS
// ==========================================

function getStatus(humidity) {
    if (humidity > DANGER_LIMIT) {
        return "DANGER";
    }

    if (humidity >= WARNING_LIMIT) {
        return "WARNING";
    }

    return "NORMAL";
}

// ==========================================
// GET LATEST THINGSPEAK DATA
// ==========================================

async function getLatestData() {
    if (!CHANNEL_ID || !READ_API_KEY) {
        throw new Error("ThingSpeak configuration missing in .env");
    }

    const response = await axios.get(
        `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds/last.json`,
        {
            params: {
                api_key: READ_API_KEY
            },
            timeout: 10000
        }
    );

    const item = response.data;

    const temperature = Number(item.field1);
    const humidity = Number(item.field2);

    const load =
        item.field3 == null || item.field3 === ""
            ? null
            : Number(item.field3);

    if (
        item.field1 == null ||
        item.field2 == null ||
        !Number.isFinite(temperature) ||
        !Number.isFinite(humidity)
    ) {
        throw new Error("Invalid sensor data received from ThingSpeak");
    }

    return {
        temperature,
        humidity,
        load,
        status: getStatus(humidity),
        timestamp: item.created_at
    };
}

// ==========================================
// SEND TELEGRAM MESSAGE
// ==========================================

async function sendTelegramAlert(message) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        throw new Error("Telegram configuration missing in .env");
    }

    const response = await axios.post(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
            chat_id: TELEGRAM_CHAT_ID,
            text: message
        },
        {
            timeout: 10000
        }
    );

    if (!response.data?.ok) {
        throw new Error("Telegram did not confirm the message");
    }

    return response.data;
}

// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
    res.json({
        message: "CementGuard backend is running!"
    });
});

// ==========================================
// LATEST CEMENT DATA
// ==========================================

app.get("/api/cement-data", async (req, res) => {
    try {
        const data = await getLatestData();
        res.json(data);
    } catch (error) {
        console.error("ThingSpeak error:", error.message);

        res.status(502).json({
            error: "Unable to fetch valid data from ThingSpeak"
        });
    }
});

// ==========================================
// HISTORICAL CEMENT DATA
// ==========================================

app.get("/api/cement-history", async (req, res) => {
    try {
        const response = await axios.get(
            `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json`,
            {
                params: {
                    api_key: READ_API_KEY,
                    results: 8000
                },
                timeout: 20000
            }
        );

        const history = response.data.feeds.map((item) => {
            const temperature =
                item.field1 == null ? null : Number(item.field1);

            const humidity =
                item.field2 == null ? null : Number(item.field2);

            const load =
                item.field3 == null ? null : Number(item.field3);

            return {
                time: item.created_at,
                temperature: Number.isFinite(temperature)
                    ? temperature : null,
                humidity: Number.isFinite(humidity)
                    ? humidity : null,
                load: Number.isFinite(load) ? load : null,
                status: Number.isFinite(humidity)
                    ? getStatus(humidity) : "UNKNOWN"
            };
        });

        res.json(history);
    } catch (error) {
        console.error("ThingSpeak history error:", error.message);

        res.status(502).json({
            error: "Unable to fetch historical data"
        });
    }
});

// ==========================================
// MANUAL TELEGRAM TEST
// ==========================================

// Protect this endpoint with a secret in .env
app.post("/api/test-telegram", async (req, res) => {
    const expectedToken = process.env.TELEGRAM_TEST_TOKEN;
    const suppliedToken = req.get("x-test-token");

    if (
        !expectedToken ||
        !suppliedToken ||
        suppliedToken !== expectedToken
    ) {
        return res.status(401).json({
            error: "Unauthorized"
        });
    }

    try {
        await sendTelegramAlert(
            "CementGuard test: Telegram alerts are connected successfully."
        );

        res.json({
            message: "Telegram accepted the test message."
        });
    } catch (error) {
        console.error(
            "Telegram test failed:",
            error.response?.data || error.message
        );

        res.status(502).json({
            error: "Telegram message failed. Check backend configuration."
        });
    }
});

// ==========================================
// AUTOMATIC CONDITION MONITORING
// ==========================================

async function monitorSensors() {
    if (monitorBusy) return;

    monitorBusy = true;

    try {
        const data = await getLatestData();
        lastMonitorError = null;

        // Do not send duplicate alerts for the same ThingSpeak record.
        if (data.timestamp === lastObservedTimestamp) {
            return;
        }

        lastObservedTimestamp = data.timestamp;

        const previousStatus = lastAlertStatus;
        const currentStatus = data.status;

        // Remember the new status, including NORMAL.
        lastAlertStatus = currentStatus;

        // Normal conditions do not need an alert.
        if (currentStatus === "NORMAL") {
            console.log("CementGuard status: NORMAL");
            return;
        }

        // Send on first observed warning/danger, or on a
        // transition from NORMAL into warning/danger.
        // Send another alert if WARNING escalates to DANGER.
        const shouldSend =
            previousStatus === null ||
            previousStatus === "NORMAL" ||
            (
                previousStatus === "WARNING" &&
                currentStatus === "DANGER"
            );

        if (!shouldSend) {
            console.log(`Status remains ${currentStatus}; no duplicate alert.`);
            return;
        }

        const message =
            `CementGuard ${currentStatus} ALERT\n\n` +
            `Humidity: ${data.humidity}%\n` +
            `Temperature: ${data.temperature} C\n` +
            `Load reading: ${data.load ?? "Unavailable"}\n\n` +
            `Please inspect the cement storage conditions.\n` +
            `Time: ${data.timestamp}`;

        await sendTelegramAlert(message);

        console.log(`Telegram alert sent for ${currentStatus}`);
    } catch (error) {
        lastMonitorError = error.message;

        console.error(
            "Sensor monitor/Telegram error:",
            error.response?.data || error.message
        );
    } finally {
        monitorBusy = false;
    }
}

// ==========================================
// MONITOR HEALTH
// ==========================================

app.get("/api/monitor-health", (req, res) => {
    res.json({
        monitoring: "running",
        lastKnownStatus: lastAlertStatus,
        lastObservedTimestamp,
        lastError: lastMonitorError
    });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
    console.log(`CementGuard backend running on port ${PORT}`);

    // Check once at startup, then every 20 seconds.
    monitorSensors();
    setInterval(monitorSensors, MONITOR_INTERVAL);
});
