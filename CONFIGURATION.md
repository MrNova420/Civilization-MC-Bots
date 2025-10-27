# ⚙️ Centralized Configuration Guide

**One place for all BetterBender 2.0 / Civilization-MC-Bots configuration**

---

## 📁 Configuration Files Overview

| File | Purpose | Required |
|------|---------|----------|
| `CONFIG.json` | Main bot configuration | ✅ Yes |
| `CONFIG.example.json` | Template/reference | No |
| `CONFIG-PRESETS.json` | Device-specific presets | No |
| `.env` | Secrets (if using) | Optional |

---

## 🚀 Quick Configuration (3 Steps)

### Step 1: Create CONFIG.json

```bash
# Copy the example
cp CONFIG.example.json CONFIG.json

# Or use setup script
npm run setup
```

### Step 2: Edit Server Settings

```json
{
  "server": {
    "host": "your-server.com",    // ← Change this
    "port": 25565,
    "version": "1.20.1"
  }
}
```

### Step 3: Choose Account Type

**Offline/Cracked (Easiest):**
```json
{
  "auth": {
    "type": "offline",
    "username": "BotName"
  }
}
```

**Microsoft Account:**
```json
{
  "auth": {
    "type": "microsoft",
    "username": "your-email@example.com"
  }
}
```

---

## 📱 Device-Specific Configurations

### Old Phone/Low-End Device

```json
{
  "mode": { "current": "afk" },
  "safety": {
    "maxCpuPercent": 30,
    "maxMemoryMB": 256,
    "maxBlocksPerHour": 50
  },
  "afkMode": {
    "movementInterval": 30000
  }
}
```

### Modern Phone/Mid-Range

```json
{
  "mode": { "current": "player" },
  "safety": {
    "maxCpuPercent": 45,
    "maxMemoryMB": 512,
    "maxBlocksPerHour": 200
  }
}
```

### PC/Laptop/High-End

```json
{
  "mode": { "current": "player" },
  "safety": {
    "maxCpuPercent": 60,
    "maxMemoryMB": 1024,
    "maxBlocksPerHour": 400
  },
  "playerMode": {
    "helpPlayers": true,
    "buildCommunity": true
  }
}
```

---

## 🏛️ Civilization Mode Configuration

### Location

Civilization configuration is separate:
- **File**: `civilization/config/settings.json`
- **Personalities**: `civilization/personalities/*.json`
- **Presets**: `civilization/presets/*.json`

### Quick Civilization Setup

```bash
# Tiny village (5 bots)
npm run civ:tiny

# Small town (10 bots)
npm run civ:small

# Medium city (20 bots)
npm run civ:medium

# Large metropolis (30 bots)
npm run civ:large

# Mega civilization (50 bots)
npm run civ:mega
```

### Custom Civilization Config

Create `civilization/config/settings.json`:

```json
{
  "server": {
    "host": "localhost",
    "port": 25565,
    "version": "1.20.1"
  },
  "civilization": {
    "botCount": 10,
    "spawnDelay": 8000,
    "personalityMix": {
      "builder": 2,
      "explorer": 2,
      "gatherer": 2,
      "social": 2,
      "default": 2
    }
  }
}
```

---

## 🔐 Security Configuration

### Dashboard Security

**IMPORTANT:** Change the default admin token!

```json
{
  "dashboard": {
    "enabled": true,
    "port": 5000,
    "adminToken": "YOUR_SECURE_TOKEN_HERE_32_CHARS_MIN"
  }
}
```

Generate a secure token:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Using Environment Variables

Create `.env` file:
```
ADMIN_TOKEN=your_secure_token
SERVER_HOST=your-server.com
SERVER_PORT=25565
```

Then in CONFIG.json, reference them:
```json
{
  "dashboard": {
    "adminToken": "${ADMIN_TOKEN}"
  },
  "server": {
    "host": "${SERVER_HOST}",
    "port": "${SERVER_PORT}"
  }
}
```

---

## 📊 All Configuration Options

### Complete CONFIG.json Template

```json
{
  "server": {
    "host": "localhost",
    "port": 25565,
    "version": "1.20.1"
  },
  
  "auth": {
    "type": "offline",
    "username": "BotName"
  },
  
  "mode": {
    "current": "player"
  },
  
  "safety": {
    "maxCpuPercent": 45,
    "maxMemoryMB": 512,
    "maxBlocksPerHour": 200,
    "checkIntervalMs": 30000,
    "enableThermalMonitoring": true,
    "enableBatteryMonitoring": true
  },
  
  "dashboard": {
    "enabled": true,
    "port": 5000,
    "adminToken": "CHANGE_THIS_TOKEN"
  },
  
  "afkMode": {
    "movementInterval": 15000,
    "statusUpdateInterval": 60000,
    "enabled": true
  },
  
  "playerMode": {
    "autoEat": true,
    "autoDefend": true,
    "helpPlayers": true,
    "buildCommunity": true,
    "exploreRadius": 500
  },
  
  "reconnect": {
    "enabled": true,
    "maxAttempts": 10,
    "initialDelayMs": 5000,
    "maxDelayMs": 60000
  },
  
  "logging": {
    "level": "info",
    "logToFile": true,
    "logDir": "data/logs",
    "maxLogSizeMB": 10,
    "maxLogFiles": 5
  },
  
  "tasks": {
    "maxQueueSize": 100,
    "enablePersistence": true
  }
}
```

---

## 🎯 Configuration by Use Case

### 24/7 AFK Bot (Minimal Resources)

```json
{
  "mode": { "current": "afk" },
  "safety": { "maxCpuPercent": 20, "maxMemoryMB": 200 },
  "afkMode": { "movementInterval": 30000 },
  "logging": { "level": "warn", "maxLogFiles": 2 }
}
```

### Active Player Bot (Full Features)

```json
{
  "mode": { "current": "player" },
  "safety": { "maxCpuPercent": 50, "maxMemoryMB": 1024 },
  "playerMode": {
    "autoEat": true,
    "autoDefend": true,
    "helpPlayers": true,
    "buildCommunity": true
  }
}
```

### Dashboard Only (Monitor Existing)

```json
{
  "dashboard": {
    "enabled": true,
    "port": 5000,
    "adminToken": "your_token"
  },
  "mode": { "current": "afk" }
}
```

---

## 🔧 Configuration Validation

Test your configuration:

```bash
# Validate JSON syntax
node -e "console.log('Valid:', !!require('./CONFIG.json'))"

# Test with setup script
npm run setup

# Run smoke tests
npm test
```

---

## 📝 Configuration Tips

### Best Practices

1. **Always change the default admin token**
2. **Start with a preset** from CONFIG-PRESETS.json
3. **Test on local server first** before 24/7 deployment
4. **Keep CONFIG.json out of version control** (contains secrets)
5. **Back up your working configuration**

### Common Mistakes

❌ **Don't:**
- Commit CONFIG.json with real credentials
- Use default admin token in production
- Set CPU limits too low (causes throttling)
- Forget to change server host from "localhost"

✅ **Do:**
- Use CONFIG.example.json as template
- Generate strong admin tokens
- Test configuration before deployment
- Monitor bot performance and adjust

---

## 🆘 Configuration Troubleshooting

### Bot Won't Connect

1. Check server host and port
2. Verify server is online
3. Check auth type matches server
4. Review logs in `data/logs/`

### High CPU Usage

1. Lower `maxCpuPercent` value
2. Increase intervals (movementInterval, etc.)
3. Switch to AFK mode
4. Use low-end preset

### Bot Keeps Disconnecting

1. Check internet stability
2. Increase reconnect delays
3. Verify server allows bot connections
4. Check logs for error messages

---

## 📚 Related Documentation

- **Presets**: See [CONFIG-PRESETS.json](CONFIG-PRESETS.json)
- **Optimization**: See [OPTIMIZATION.md](OPTIMIZATION.md)
- **Security**: See [SECURITY.md](SECURITY.md)
- **All Docs**: See [DOCS_INDEX.md](DOCS_INDEX.md)

---

**Last Updated:** October 27, 2025  
**Applies To:** BetterBender 2.0 (All Modes)
