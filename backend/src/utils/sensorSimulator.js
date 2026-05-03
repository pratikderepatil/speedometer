const { config } = require("../config");
const db = require("../config/database");

class SensorSimulator {
  constructor(wsManager) {
    this.wsManager = wsManager;
    this.intervalId = null;
    this.isRunning = false;
    this.readingsCount = 0;
  }

  async start() {
    if (!config.simulator.enabled) {
      console.log("Sensor simulator is disabled");
      return;
    }

    if (this.isRunning) {
      console.log("Sensor simulator already running");
      return;
    }

    const { intervalMs, minSpeed, maxSpeed } = config.simulator;

    console.log(
      `Starting sensor simulator (interval: ${intervalMs}ms, range: ${minSpeed}-${maxSpeed} km/h)`
    );

    this.intervalId = setInterval(async () => {
      await this.generateReading();
    }, intervalMs);

    this.isRunning = true;
  }

  async generateReading() {
    try {
      const speed = this.generateRandomSpeed();

      const result = await db.query(
        "INSERT INTO speed_log (speed) VALUES ($1) RETURNING id, speed, timestamp",
        [speed]
      );

      const reading = result.rows[0];
      this.readingsCount++;

      if (this.wsManager) {
        this.wsManager.broadcastSpeedUpdate(reading);
      }

      if (this.readingsCount % 100 === 0) {
        console.log(`Simulator: ${this.readingsCount} readings generated`);
      }
    } catch (error) {
      console.error("Error generating reading:", error.message);
    }
  }

  generateRandomSpeed() {
    const { minSpeed, maxSpeed } = config.simulator;
    const range = maxSpeed - minSpeed;

    const random = Math.random();

    const change =
      Math.random() > 0.8
        ? (Math.random() - 0.5) * 20
        : (Math.random() - 0.5) * 10;

    const baseSpeed = minSpeed + random * range;
    const smoothedSpeed = baseSpeed + change;

    return Math.max(minSpeed, Math.min(maxSpeed, smoothedSpeed));
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log("Sensor simulator stopped");
    }
  }

  getStats() {
    return {
      isRunning: this.isRunning,
      totalReadings: this.readingsCount,
      config: {
        enabled: config.simulator.enabled,
        intervalMs: config.simulator.intervalMs,
        minSpeed: config.simulator.minSpeed,
        maxSpeed: config.simulator.maxSpeed,
      },
    };
  }

  async injectReading(speed) {
    if (typeof speed !== "number" || speed < 0 || speed > 300) {
      throw new Error("Invalid speed value");
    }

    const result = await db.query(
      "INSERT INTO speed_log (speed) VALUES ($1) RETURNING id, speed, timestamp",
      [speed]
    );

    const reading = result.rows[0];

    if (this.wsManager) {
      this.wsManager.broadcastSpeedUpdate(reading);
    }

    return reading;
  }
}

module.exports = SensorSimulator;
