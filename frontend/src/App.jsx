import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const socket = io(API_URL);

function SpeedometerGauge({ speed, maxSpeed = 120 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height * 0.85;
    const radius = width * 0.4;

    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 0, false);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 20;
    ctx.stroke();

    const segments = [
      { start: 0, end: 0.25, color: "#4ade80" },
      { start: 0.25, end: 0.5, color: "#facc15" },
      { start: 0.5, end: 0.75, color: "#f97316" },
      { start: 0.75, end: 1, color: "#ef4444" },
    ];

    segments.forEach((seg) => {
      ctx.beginPath();
      const startAngle = Math.PI + seg.start * Math.PI;
      const endAngle = Math.PI + seg.end * Math.PI;
      ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = 16;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    const normalizedSpeed = Math.min(speed, maxSpeed) / maxSpeed;
    const needleAngle = Math.PI + normalizedSpeed * Math.PI;

    const needleLength = radius * 0.8;
    const needleX = centerX + Math.cos(needleAngle) * needleLength;
    const needleY = centerY + Math.sin(needleAngle) * needleLength;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(needleX, needleY);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();

    ctx.fillStyle = "#888";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";

    for (let i = 0; i <= 120; i += 20) {
      const angle = Math.PI + (i / maxSpeed) * Math.PI;
      const tickRadius = radius + 25;
      const tickX = centerX + Math.cos(angle) * tickRadius;
      const tickY = centerY + Math.sin(angle) * tickRadius;
      ctx.fillText(i.toString(), tickX, tickY);
    }
  }, [speed, maxSpeed]);

  return (
    <div className="gauge-container">
      <canvas ref={canvasRef} width={300} height={180} />
      <div className="speed-display">
        <span className="speed-value">{speed.toFixed(1)}</span>
        <span className="speed-unit">km/h</span>
      </div>
    </div>
  );
}

function App() {
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [history, setHistory] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetchLatestSpeed();
    fetchHistory();
  }, []);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setConnected(false);
    });

    socket.on("speed-update", (data) => {
      setCurrentSpeed(data.speed);

      setChartData((prev) => {
        const newData = [
          ...prev,
          {
            time: new Date(data.timestamp).toLocaleTimeString(),
            speed: data.speed,
          },
        ];
        return newData.slice(-60);
      });

      setHistory((prev) => {
        const newHistory = [data, ...prev];
        return newHistory.slice(0, 100);
      });
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("speed-update");
    };
  }, []);

  async function fetchLatestSpeed() {
    try {
      const response = await fetch(`${API_URL}/api/speed/latest`);
      const json = await response.json();
      const data = json.data || json;
      if (data.speed !== undefined) {
        setCurrentSpeed(data.speed);
      }
    } catch (error) {
      console.error("Error fetching latest speed:", error);
    }
  }

  async function fetchHistory() {
    try {
      const response = await fetch(`${API_URL}/api/speed/history?limit=100`);
      const json = await response.json();
      const data = json.data || json;
      if (Array.isArray(data)) {
        setHistory(data);

        const chartDataPoints = data
          .slice(0, 60)
          .reverse()
          .map((item) => ({
            time: new Date(item.timestamp).toLocaleTimeString(),
            speed: item.speed,
          }));
        setChartData(chartDataPoints);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Real-Time Speedometer</h1>
        <div
          className={`connection-status ${connected ? "connected" : "disconnected"}`}
        >
          {connected ? "● Connected" : "○ Disconnected"}
        </div>
      </header>

      <main className="main-content">
        <section className="gauge-section">
          <h2>Current Speed</h2>
          <SpeedometerGauge speed={currentSpeed} />
        </section>

        <section className="chart-section">
          <h2>Speed History (Last 60 seconds)</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="time" stroke="#888" tick={{ fontSize: 10 }} />
                <YAxis
                  domain={[0, 120]}
                  stroke="#888"
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a2e",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="speed"
                  stroke="#4ade80"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="table-section">
          <h2>Speed Log (Last 100 Readings)</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Speed (km/h)</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.speed.toFixed(2)}</td>
                    <td>{new Date(item.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
