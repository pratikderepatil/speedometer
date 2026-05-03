const { config } = require("../config");

class WebSocketManager {
  constructor(io) {
    this.io = io;
    this.connectedClients = new Set();
  }

  initialize() {
    this.io.on("connection", (socket) => {
      this.connectedClients.add(socket.id);

      console.log(
        `Client connected: ${socket.id} (Total: ${this.connectedClients.size})`
      );

      socket.emit("connected", {
        socketId: socket.id,
        timestamp: new Date().toISOString(),
        message: "Connected to speedometer server",
      });

      socket.on("request-latest", () => {
        socket.emit("requested-latest", { received: true });
      });

      socket.on("disconnect", () => {
        this.connectedClients.delete(socket.id);
        console.log(
          `Client disconnected: ${socket.id} (Total: ${this.connectedClients.size})`
        );
      });

      socket.on("error", (error) => {
        console.error(`Socket error for ${socket.id}:`, error.message);
      });
    });

    this.io.engine.on("ping-timeout", (socket) => {
      console.log(`Ping timeout for socket: ${socket.id}`);
    });

    console.log("WebSocket handlers initialized");
  }

  broadcastSpeedUpdate(data) {
    if (this.io) {
      this.io.emit("speed-update", data);
    }
  }

  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  getClientCount() {
    return this.connectedClients.size;
  }

  sendTo(socketId, event, data) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(event, data);
    }
  }
}

module.exports = WebSocketManager;
