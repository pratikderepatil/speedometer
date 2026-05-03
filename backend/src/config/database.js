const { Pool } = require("pg");
const { config } = require("./index");

class DatabaseManager {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.pool) {
      return this.pool;
    }

    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.user,
      password: config.database.password,
      max: config.database.max,
      idleTimeoutMillis: config.database.idleTimeoutMillis,
      connectionTimeoutMillis: config.database.connectionTimeoutMillis,
    });

    this.pool.on("error", (err, client) => {
      console.error("Unexpected pool error:", err.message);
    });

    try {
      const client = await this.pool.connect();
      client.release();
      this.isConnected = true;
      console.log("Database connected successfully");
    } catch (error) {
      console.error("Database connection failed:", error.message);
      throw error;
    }

    return this.pool;
  }

  getPool() {
    if (!this.pool) {
      throw new Error("Database not initialized. Call connect() first.");
    }
    return this.pool;
  }

  async query(text, params) {
    const pool = this.getPool();
    const start = Date.now();

    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;

      if (config.server.nodeEnv === "development" && duration > 100) {
        console.log(`Slow query (${duration}ms): ${text.substring(0, 50)}...`);
      }

      return result;
    } catch (error) {
      console.error("Query error:", error.message);
      throw error;
    }
  }

  async initializeSchema() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS speed_log (
        id SERIAL PRIMARY KEY,
        speed FLOAT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_speed_log_timestamp 
      ON speed_log(timestamp DESC);
    `;

    try {
      await this.query(createTableSQL);
      console.log("Database schema initialized");
    } catch (error) {
      console.error("Schema initialization failed:", error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      console.log("Database disconnected");
    }
  }

  async healthCheck() {
    try {
      const result = await this.query("SELECT 1 as ok");
      return result.rows[0]?.ok === 1;
    } catch {
      return false;
    }
  }
}

module.exports = new DatabaseManager();
