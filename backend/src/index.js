require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const { config, validateConfig } = require("./config");
const db = require("./config/database");
const speedRoutes = require("./routes/speedRoutes");
const WebSocketManager = require("./utils/websocket");
const SensorSimulator = require("./utils/sensorSimulator");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.websocket.corsOrigin,
    methods: ["GET", "POST"],
  },
  pingInterval: config.websocket.pingInterval,
  pingTimeout: config.websocket.pingTimeout,
});

app.use(
  cors({
    origin: config.websocket.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.server.nodeEnv === "development") {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    next();
  });
}

app.get("/health", async (req, res) => {
  const dbHealthy = await db.healthCheck();
  const status = dbHealthy ? "healthy" : "degraded";

  res.status(dbHealthy ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? "up" : "down",
      simulator: sensorSimulator?.isRunning ? "running" : "stopped",
    },
  });
});

app.use("/api/speed", speedRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

let wsManager;
let sensorSimulator;

/**
 * Start the application server
 */
async function startServer() {
  try {
    validateConfig();
    console.log("Configuration validated");

    await db.connect();
    console.log("Database connection established");

    await db.initializeSchema();
    console.log("Database schema ready");

    wsManager = new WebSocketManager(io);
    wsManager.initialize();

    sensorSimulator = new SensorSimulator(wsManager);
    await sensorSimulator.start();

    server.listen(config.server.port, () => {
      console.table({
  Port: config.server.port,
  Environment: config.server.nodeEnv,
  WebSocket: "Enabled",
  Simulator: config.simulator.enabled ? "Enabled" : "Disabled"
});
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    server.close(() => {
      console.log("HTTP server closed");
    });

    if (sensorSimulator) {
      sensorSimulator.stop();
    }

    await db.disconnect();

    console.log("Graceful shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error.message);
    process.exit(1);
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

startServer();

module.exports = { app, server, io };
