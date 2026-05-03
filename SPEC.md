# Speedometer Real-Time Application Specification

## 1. Architecture Overview

### Block Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        React Frontend                               │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────────┐  │   │
│  │  │ Speedometer │  │  Chart       │  │   History Table            │  │   │
│  │  │   Gauge    │  │  (last 60s)  │  │   (last 100 readings)      │  │   │
│  │  └─────────────┘  └──────────────┘  └────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                             │
│                    WebSocket / Polling                                     │
└──────────────────────────────│─────────────────────────────────────────────┘
                               │
┌──────────────────────────────│─────────────────────────────────────────────┐
│                              │        APPLICATION LAYER                    │
│                    ┌─────────▼─────────┐                                   │
│                    │    Node.js API    │                                   │
│  ┌─────────────┐   │                   │   ┌─────────────────────────┐     │
│  │   Sensor    │──►│  REST Endpoints   │   │   WebSocket Server      │     │
│  │  Simulator  │   │  - GET /speed     │   │   (real-time updates)   │     │
│  │  (1 sec)    │   │  - POST /speed    │   │                         │     │
│  └─────────────┘   └─────────┬─────────┘   └───────────┬─────────────┘     │
│                              │                         │                   │
└──────────────────────────────│─────────────────────────│───────────────────┘
                               │                         │
┌──────────────────────────────│─────────────────────────│───────────────────┐
│                              │        DATA LAYER        │                   │
│                    ┌─────────▼─────────┐               │                   │
│                    │   PostgreSQL      │◄───────────────┘                   │
│                    │   Database        │                                     │
│                    │                   │                                     │
│                    │  Table: speed_log │                                     │
│                    │  - id             │                                     │
│                    │  - speed (km/h)   │                                     │
│                    │  - timestamp      │                                     │
│                    └───────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| Database | PostgreSQL | Store time-series speed data |
| Backend API | Node.js + Express | REST API for data access |
| WebSocket | Socket.io | Real-time push to frontend |
| Frontend | React + Vite | UI with real-time speedometer |
| Sensor Simulator | Node.js | Generate speed data every 1 sec |

---

## 2. Technical Stack

- **Database**: PostgreSQL
- **Backend**: Node.js + Express + Socket.io
- **Frontend**: React + Vite
- **Containerization**: Docker + Docker Compose

---

## 3. Database Schema

```sql
CREATE TABLE speed_log (
    id SERIAL PRIMARY KEY,
    speed FLOAT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/speed/latest | Get latest speed reading |
| GET | /api/speed/history | Get speed history (default: last 100) |
| POST | /api/speed | Insert new speed reading |

---

## 5. Real-Time Flow

1. Sensor simulator generates random speed (0-120 km/h) every 1 second
2. POST request inserts speed to PostgreSQL
3. Backend emits WebSocket event with new speed data
4. React frontend receives event and updates UI in real-time

---

## 6. UI Components

1. **Speedometer Gauge**: Circular gauge showing current speed (0-120 km/h)
2. **Speed Chart**: Line chart showing last 60 seconds of data
3. **History Table**: Table showing last 100 readings

---

## 7. Acceptance Criteria

- [x] Speed data recorded every 1 second in PostgreSQL
- [x] Real-time UI updates without page refresh
- [x] Dockerized application (backend, frontend, database)
- [x] Speedometer gauge displays current speed visually
- [x] Source code includes necessary comments