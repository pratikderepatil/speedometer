const db = require("../config/database");
const { config } = require("../config");

async function getLatestSpeed(req, res) {
  try {
    const result = await db.query(
      "SELECT id, speed, timestamp FROM speed_log ORDER BY timestamp DESC LIMIT 1"
    );

    const latest = result.rows[0] || { speed: 0, timestamp: null };

    res.json({
      success: true,
      data: latest,
    });
  } catch (error) {
    console.error("Error fetching latest speed:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch latest speed",
    });
  }
}

async function getSpeedHistory(req, res) {
  try {
    const limit = Math.min(
      parseInt(req.query.limit, 10) || config.api.historyLimit,
      1000
    );

    const result = await db.query(
      "SELECT id, speed, timestamp FROM speed_log ORDER BY timestamp DESC LIMIT $1",
      [limit]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching speed history:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch speed history",
    });
  }
}

async function insertSpeed(req, res) {
  const { speed } = req.body;

  if (speed === undefined || typeof speed !== "number" || isNaN(speed)) {
    return res.status(400).json({
      success: false,
      error: "Invalid speed value. Expected a valid number.",
    });
  }

  if (speed < 0 || speed > 300) {
    return res.status(400).json({
      success: false,
      error: "Speed must be between 0 and 300 km/h",
    });
  }

  try {
    const result = await db.query(
      "INSERT INTO speed_log (speed) VALUES ($1) RETURNING id, speed, timestamp",
      [speed]
    );

    const newReading = result.rows[0];

    res.status(201).json({
      success: true,
      data: newReading,
    });
  } catch (error) {
    console.error("Error inserting speed:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to insert speed reading",
    });
  }
}

async function getStats(req, res) {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_readings,
        AVG(speed) as avg_speed,
        MAX(speed) as max_speed,
        MIN(speed) as min_speed
      FROM speed_log
      WHERE timestamp > NOW() - INTERVAL '1 hour'
    `);

    const stats = result.rows[0];

    res.json({
      success: true,
      data: {
        totalReadings: parseInt(stats.total_readings, 10),
        avgSpeed: parseFloat(stats.avg_speed) || 0,
        maxSpeed: parseFloat(stats.max_speed) || 0,
        minSpeed: parseFloat(stats.min_speed) || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
    });
  }
}

module.exports = {
  getLatestSpeed,
  getSpeedHistory,
  insertSpeed,
  getStats,
};
