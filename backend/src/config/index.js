const config = {
  server: {
    port: parseInt(process.env.PORT || "3001", 10),
    nodeEnv: process.env.NODE_ENV || "development",
  },

  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    database: process.env.DB_NAME || "speedometer",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    max: parseInt(process.env.DB_POOL_SIZE || "20", 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  websocket: {
    corsOrigin: process.env.CORS_ORIGIN || "*",
    pingInterval: 25000,
    pingTimeout: 60000,
  },

  simulator: {
    enabled: process.env.SIMULATOR_ENABLED !== "false",
    intervalMs: parseInt(process.env.SIMULATOR_INTERVAL || "1000", 10),
    minSpeed: parseFloat(process.env.SIMULATOR_MIN_SPEED || "0"),
    maxSpeed: parseFloat(process.env.SIMULATOR_MAX_SPEED || "120"),
  },

  api: {
    historyLimit: parseInt(process.env.API_HISTORY_LIMIT || "100", 10),
    chartDataLimit: parseInt(process.env.API_CHART_LIMIT || "60", 10),
  },
};

function validateConfig() {
  const required = ["database.host", "database.database", "database.user"];
  const missing = required.filter((path) => {
    const keys = path.split(".");
    let value = config;
    for (const key of keys) {
      value = value?.[key];
    }
    return !value;
  });

  if (missing.length > 0) {
    throw new Error(`Missing required config: ${missing.join(", ")}`);
  }

  return true;
}

module.exports = { config, validateConfig };
