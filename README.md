# Real-Time Speedometer Application

## Project Structure

```
speedometer/
├── SPEC.md                    # Architecture and specification
├── README.md                  # This file
├── docker-compose.yml         # Full stack Docker configuration
├── backend/
│   ├── package.json           # Node.js dependencies
│   ├── server.js             # Express API with Socket.io
│   └── Dockerfile            # Backend container
└── frontend/
    ├── package.json          # React dependencies
    ├── vite.config.js        # Vite configuration
    ├── index.html            # Entry HTML
    ├── Dockerfile            # Frontend container
    └── src/
        ├── main.jsx          # React entry point
        ├── App.jsx           # Main React component
        └── App.css           # Styling
```

## Architecture Block Diagram

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
│                    │  Table: speed_log │                                     │
│                    │  - id             │                                     │
│                    │  - speed (km/h)   │                                     │
│                    │  - timestamp      │                                     │
│                    └───────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## How to Run

### Option 1: Docker (Recommended)

1. Ensure Docker and Docker Compose are installed
2. Run from the `speedometer` directory:

```bash
docker-compose up --build
```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Option 2: Manual Setup

#### Backend (Node.js + PostgreSQL)

1. Install PostgreSQL and create a database named `speedometer`
2. Navigate to backend directory:
   ```bash
   cd backend
   npm install
   ```
3. Set environment variables:
   ```bash
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_NAME=speedometer
   export DB_USER=postgres
   export DB_PASSWORD=postgres
   ```
4. Start the backend:
   ```bash
   npm start
   ```

#### Frontend (React + Vite)

1. Navigate to frontend directory:
   ```bash
   cd frontend
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Access the frontend at http://localhost:3000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/speed/latest | Get latest speed reading |
| GET | /api/speed/history | Get speed history (default: last 100) |
| POST | /api/speed | Insert new speed reading |

## Real-Time Features

- **WebSocket**: Socket.io pushes speed updates to all connected clients instantly
- **Sensor Simulator**: Built-in simulator generates random speed (0-120 km/h) every 1 second
- **Auto-refresh**: UI updates automatically without page refresh

## UI Components

1. **Speedometer Gauge**: Canvas-based circular gauge (0-120 km/h)
2. **Speed Chart**: Line chart showing last 60 seconds using Recharts
3. **History Table**: Table displaying last 100 speed readings

## Key Design Decisions

1. **WebSocket over Polling**: Real-time updates using Socket.io for instant UI refresh
2. **PostgreSQL**: Reliable time-series data storage with efficient querying
3. **Sensor Simulator**: Built-in to demonstrate real-time data without external hardware
4. **Canvas Gauge**: Custom canvas-based speedometer for smooth animation
5. **Containerization**: Full Docker support for easy deployment