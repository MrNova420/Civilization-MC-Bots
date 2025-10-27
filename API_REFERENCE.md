# 📡 API Reference

Complete API reference for BetterBender 2.0 / Civilization-MC-Bots

---

## Dashboard API Endpoints

### Base URL
```
http://localhost:5000/api
```

---

## 🏥 Health & Monitoring

### GET /health

Health check endpoint for monitoring systems.

**Authentication:** None  
**Response:** 200 OK

```json
{
  "status": "healthy",
  "timestamp": "2025-10-27T22:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 123456789,
    "heapTotal": 98765432,
    "heapUsed": 45678901,
    "external": 1234567,
    "arrayBuffers": 123456
  },
  "version": "2.0.0",
  "bot": {
    "connected": true,
    "health": 20,
    "food": 20
  }
}
```

### GET /ready

Readiness check for orchestration systems (Kubernetes, Docker Swarm).

**Authentication:** None  
**Response:** 200 OK (ready) / 503 Service Unavailable (not ready)

```json
{
  "ready": true,
  "timestamp": "2025-10-27T22:00:00.000Z",
  "botInitialized": true
}
```

### GET /metrics

Prometheus-compatible metrics endpoint.

**Authentication:** None  
**Response:** 200 OK  
**Content-Type:** text/plain; version=0.0.4

```
# HELP nodejs_heap_size_bytes Node.js heap size in bytes
# TYPE nodejs_heap_size_bytes gauge
nodejs_heap_size_bytes 45678901

# HELP nodejs_external_memory_bytes Node.js external memory in bytes
# TYPE nodejs_external_memory_bytes gauge
nodejs_external_memory_bytes 1234567

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds counter
process_uptime_seconds 3600

# HELP bot_connected Bot connection status (1=connected, 0=disconnected)
# TYPE bot_connected gauge
bot_connected 1

# HELP bot_health Bot health points
# TYPE bot_health gauge
bot_health 20

# HELP bot_food Bot food level
# TYPE bot_food gauge
bot_food 20
```

---

## 🤖 Bot Status

### GET /api/status

Get current bot status.

**Authentication:** None  
**Response:** 200 OK

```json
{
  "connected": true,
  "username": "BotName",
  "health": 20,
  "food": 20,
  "position": {
    "x": 123.45,
    "y": 64.0,
    "z": -67.89
  },
  "dimension": "overworld",
  "level": 5,
  "experience": 1234
}
```

---

## 📊 Activities

### GET /api/activities

Get bot activities.

**Authentication:** Required (Admin Token)  
**Response:** 200 OK

**Query Parameters:**
- `type` (optional) - Filter by activity type
- `limit` (optional) - Number of results (default: 50)

```json
{
  "activities": [
    {
      "id": "activity-123",
      "type": "mining",
      "timestamp": "2025-10-27T22:00:00.000Z",
      "description": "Mined 16 stone",
      "success": true
    }
  ]
}
```

### GET /api/activities/stats

Get activity statistics.

**Authentication:** Required (Admin Token)  
**Response:** 200 OK

```json
{
  "total": 1234,
  "byType": {
    "mining": 456,
    "building": 234,
    "exploring": 345,
    "trading": 123,
    "other": 76
  },
  "last24Hours": 89
}
```

---

## 🎯 Goals

### GET /api/goals

Get bot goals and progress.

**Authentication:** Required (Admin Token)  
**Response:** 200 OK

```json
{
  "goals": {
    "wood_collected": {
      "target": 64,
      "current": 48,
      "progress": 75
    },
    "house_built": {
      "target": 1,
      "current": 0,
      "progress": 0
    }
  }
}
```

---

## ⚙️ Configuration

### GET /api/config

Get current configuration (sanitized - no secrets).

**Authentication:** Required (Admin Token)  
**Response:** 200 OK

```json
{
  "server": {
    "host": "localhost",
    "port": 25565,
    "version": "1.20.1"
  },
  "mode": {
    "current": "player"
  },
  "safety": {
    "maxCpuPercent": 45,
    "maxMemoryMB": 512
  }
}
```

### POST /api/server/config

Update server configuration.

**Authentication:** Required (Admin Token)  
**Request Body:**

```json
{
  "host": "new-server.com",
  "port": 25565,
  "version": "1.20.1"
}
```

**Response:** 200 OK

```json
{
  "success": true,
  "message": "Server configuration updated"
}
```

---

## 🔐 Authentication

Most endpoints require admin token authentication.

### Header Method

```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

### Query Parameter Method

```
GET /api/status?token=YOUR_ADMIN_TOKEN
```

### Setting Admin Token

Edit `CONFIG.json`:

```json
{
  "dashboard": {
    "adminToken": "your-secure-token-here"
  }
}
```

**⚠️ Security Note:** Always use a strong, unique token in production!

---

## 🧪 Minecraft Progress

### GET /api/minecraft-progress

Get Minecraft progression data.

**Authentication:** Required (Admin Token)  
**Response:** 200 OK

```json
{
  "progress": {
    "overworld": {
      "explored": true,
      "achievements": ["first_tree", "stone_age"]
    },
    "nether": {
      "explored": false,
      "achievements": []
    }
  }
}
```

---

## 🤝 AI Status

### GET /api/ai-status

Get AI behavior status.

**Authentication:** Required (Admin Token)  
**Response:** 200 OK

```json
{
  "ai": {
    "currentState": "gathering",
    "nextGoal": "build_shelter",
    "personality": "builder",
    "emotions": {
      "happiness": 0.8,
      "hunger": 0.2,
      "safety": 0.9
    }
  }
}
```

---

## 🏛️ Civilization API

### Endpoints

Civilization mode has separate endpoints on port 3001 (configurable).

### GET http://localhost:3001/api/civilization/status

Get civilization system status.

**Response:** 200 OK

```json
{
  "bots": 10,
  "villages": 2,
  "totalPopulation": 10,
  "uptime": 7200,
  "status": "running"
}
```

### GET http://localhost:3001/api/civilization/bots

Get all bots in civilization.

**Response:** 200 OK

```json
{
  "bots": [
    {
      "id": "bot-123",
      "name": "Builder_1",
      "personality": "builder",
      "village": "village-1",
      "status": "active"
    }
  ]
}
```

### GET http://localhost:3001/api/civilization/villages

Get all villages.

**Response:** 200 OK

```json
{
  "villages": [
    {
      "id": "village-1",
      "name": "Oakwood Village",
      "population": 5,
      "founded": "2025-10-27T20:00:00.000Z"
    }
  ]
}
```

---

## 📡 WebSocket Events

### Connection

```javascript
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Connected to dashboard');
});
```

### Events

**bot:status** - Real-time bot status updates
```javascript
socket.on('bot:status', (data) => {
  console.log('Bot status:', data);
});
```

**bot:activity** - New activity notifications
```javascript
socket.on('bot:activity', (activity) => {
  console.log('New activity:', activity);
});
```

**bot:disconnect** - Bot disconnection events
```javascript
socket.on('bot:disconnect', () => {
  console.log('Bot disconnected');
});
```

**bot:reconnect** - Bot reconnection events
```javascript
socket.on('bot:reconnect', () => {
  console.log('Bot reconnected');
});
```

---

## 🔧 Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Invalid request parameters"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Invalid or missing admin token"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 503 Service Unavailable

```json
{
  "ready": false,
  "timestamp": "2025-10-27T22:00:00.000Z"
}
```

---

## 📊 Rate Limiting

**Current Status:** Not implemented (planned for future release)

**Planned Limits:**
- 100 requests per 15 minutes per IP
- 1000 WebSocket messages per minute

---

## 🔒 Security Best Practices

1. **Use HTTPS in production** (planned feature)
2. **Change default admin token** immediately
3. **Restrict dashboard to trusted networks**
4. **Monitor access logs** regularly
5. **Keep dependencies updated** (`npm audit`)

---

## 📚 Code Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const ADMIN_TOKEN = 'your-admin-token';

async function getBotStatus() {
  const response = await axios.get(`${API_URL}/status`);
  return response.data;
}

async function getActivities() {
  const response = await axios.get(`${API_URL}/activities`, {
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    },
    params: {
      limit: 10
    }
  });
  return response.data;
}
```

### Python

```python
import requests

API_URL = 'http://localhost:5000/api'
ADMIN_TOKEN = 'your-admin-token'

def get_bot_status():
    response = requests.get(f'{API_URL}/status')
    return response.json()

def get_activities():
    headers = {'Authorization': f'Bearer {ADMIN_TOKEN}'}
    params = {'limit': 10}
    response = requests.get(f'{API_URL}/activities', 
                          headers=headers, 
                          params=params)
    return response.json()
```

### cURL

```bash
# Get bot status
curl http://localhost:5000/api/status

# Get activities (with auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:5000/api/activities?limit=10"

# Health check
curl http://localhost:5000/health

# Metrics
curl http://localhost:5000/metrics
```

---

## 🆘 Support

- **Documentation:** [DOCS_INDEX.md](DOCS_INDEX.md)
- **Issues:** [GitHub Issues](https://github.com/MrNova420/Civilization-MC-Bots/issues)
- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md)

---

**Last Updated:** October 27, 2025  
**API Version:** 2.0.0
