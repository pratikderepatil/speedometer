const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "postgres",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "speedometer",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
});

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS speed_log (
        id SERIAL PRIMARY KEY,
        speed FLOAT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

app.get("/api/speed/latest", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM speed_log ORDER BY timestamp DESC LIMIT 1"
    );
    res.json(result.rows[0] || { speed: 0, timestamp: null });
  } catch (error) {
    console.error("Error fetching latest speed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/speed/history", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const result = await pool.query(
      "SELECT * FROM speed_log ORDER BY timestamp DESC LIMIT $1",
      [limit]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching speed history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/speed", async (req, res) => {
  const { speed } = req.body;

  if (speed === undefined || isNaN(speed)) {
    return res.status(400).json({ error: "Invalid speed value" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO speed_log (speed) VALUES ($1) RETURNING *",
      [speed]
    );

    const newReading = result.rows[0];

    io.emit("speed-update", newReading);

    res.status(201).json(newReading);
  } catch (error) {
    console.error("Error inserting speed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

function startSensorSimulator() {
  console.log("Starting sensor simulator...");

  setInterval(async () => {
    const speed = Math.random() * 120;

    try {
      const result = await pool.query(
        "INSERT INTO speed_log (speed) VALUES ($1) RETURNING *",
        [speed]
      );

      const newReading = result.rows[0];
      io.emit("speed-update", newReading);
      console.log(`Simulated speed: ${speed.toFixed(2)} km/h`);
    } catch (error) {
      console.error("Error in sensor simulator:", error);
    }
  }, 1000);
}

const PORT = process.env.PORT || 3001;

initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startSensorSimulator();
  });
});
