# 🔧 Troubleshooting Guide

This guide addresses common issues and their solutions.

## Table of Contents
- [Bot Not Starting](#bot-not-starting)
- [Configuration Issues](#configuration-issues)
- [Bot Keeps Dying](#bot-keeps-dying)
- [Connection Problems](#connection-problems)
- [Custom Addons Not Loading](#custom-addons-not-loading)
- [Dashboard Not Accessible](#dashboard-not-accessible)
- [Performance Issues](#performance-issues)

---

## Bot Not Starting

### Issue: `Cannot find module` errors

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Issue: `CONFIG.json not found`

**Solution:**
1. Run the setup script: `npm run setup`
2. Or manually copy: `cp CONFIG.example.json CONFIG.json`
3. Edit `CONFIG.json` with your server details

---

## Configuration Issues

### Issue: Bot not using my custom configuration

**Problem:** The bot might be using default values instead of your CONFIG.json settings.

**Solution:**
1. Verify `CONFIG.json` exists in the root directory
2. Check that it's valid JSON (use a JSON validator)
3. Ensure proper file permissions: `chmod 644 CONFIG.json`
4. Restart the bot completely (don't just reload)

### Issue: Changes to CONFIG.json not taking effect

**Solution:**
- Stop the bot completely (Ctrl+C or pm2 stop)
- Edit CONFIG.json
- Restart: `npm start` or `pm2 restart all`
- Changes are loaded on startup, not during runtime

---

## Bot Keeps Dying

### Issue: Bot repeatedly dies from mobs in AFK mode

**Recent Fix (v2.0.1):**
We've significantly improved bot survival in AFK mode:
- Increased threat detection range (16 → 20 blocks)
- More aggressive fleeing (starts at health < 16 instead of < 14)
- Longer flee distance (50-60 → 70-80 blocks)
- Extended flee duration (7-8s → 9-10s)
- Faster threat checking (300ms → 200ms)

**Additional Solutions:**

1. **Ensure the bot spawns in a safe area**
   - Use `/setworldspawn` in a well-lit, enclosed area
   - Avoid spawn points near mob spawners

2. **Adjust configuration for better survival:**
```json
{
  "afkMode": {
    "avoidMobs": true,
    "autoEat": true,
    "autoRespawn": true,
    "movementRange": 5
  }
}
```

3. **Switch to Player mode for smarter behavior:**
```json
{
  "mode": {
    "current": "player",
    "autoSwitch": true
  }
}
```

4. **Give the bot starting items:**
   - Join the server manually first
   - Give your bot some food and basic armor
   - Place items in a chest near spawn

---

## Connection Problems

### Issue: `ECONNREFUSED` or `Connection refused`

**Solution:**
- Server is offline → Bot will auto-retry
- Check server address in CONFIG.json
- Verify port number is correct
- Try direct IP instead of domain

### Issue: `ENOTFOUND` - Cannot resolve hostname

**Solution:**
```json
{
  "server": {
    "host": "123.456.789.0",  // Use IP instead of domain
    "port": 25565
  }
}
```

### Issue: `read ECONNRESET` - Connection drops immediately

**Common causes:**
1. Server version mismatch
2. Server-side kick/ban
3. Network issues

**Solution:**
- Verify Minecraft version in CONFIG.json matches server
- Check server whitelist/bans
- Update mineflayer: `npm install mineflayer@latest`

---

## Custom Addons Not Loading

### Issue: Custom addons in `addons-custom/` folder not loading

**Recent Fix (v2.0.1):**
Fixed incorrect path in launcher.js (was `../addons-custom`, now `./addons-custom`)

**Verify Fix Worked:**
1. Check console output on startup for: `[Custom Addon] <name> loaded`
2. If not shown, addon failed to load

**Common Issues:**

1. **Wrong file location**
   ```
   ✅ Correct: ./addons-custom/my-addon.js
   ❌ Wrong:   ./addons/my-addon.js
   ```

2. **Invalid addon structure**
   ```javascript
   // Minimum required structure:
   class MyAddon {
     constructor() {
       this.name = 'my-addon';
     }
     
     init(bot, engine) {
       this.bot = bot;
       this.engine = engine;
     }
     
     enable() {
       // Your code here
     }
     
     disable() {
       // Cleanup code
     }
   }
   
   module.exports = new MyAddon();
   ```

3. **Syntax errors in addon**
   - Check console for error messages
   - Test addon in isolation first

---

## Dashboard Not Accessible

### Issue: Cannot access `http://localhost:5000`

**Solutions:**

1. **Try alternative URLs:**
   - http://127.0.0.1:5000
   - http://0.0.0.0:5000
   - http://[your-ip]:5000

2. **Check if dashboard is enabled:**
```json
{
  "dashboard": {
    "enabled": true,
    "port": 5000
  }
}
```

3. **Port already in use:**
```json
{
  "dashboard": {
    "port": 5001  // Try a different port
  }
}
```

4. **Firewall blocking:**
   - Allow Node.js through firewall
   - On Termux: No firewall issues usually

5. **Check dashboard logs:**
   - Console should show: `[Dashboard] Server running on http://0.0.0.0:5000`
   - If not shown, dashboard failed to start

---

## Performance Issues

### Issue: High CPU usage

**Solution:**
```json
{
  "safety": {
    "maxCpuPercent": 30,        // Lower for old devices
    "autoThrottle": true,        // Enable auto throttling
    "enableIdleMode": true       // Reduce activity when safe
  }
}
```

### Issue: High memory usage

**Solution:**
```json
{
  "safety": {
    "maxMemoryMB": 256,          // Adjust based on device
    "enableIdleMode": true
  },
  "logging": {
    "level": "info",             // Reduce logging
    "maxLogFiles": 3             // Keep fewer log files
  }
}
```

### Issue: Bot laggy or slow to respond

**Common causes:**
1. Server lag
2. Device overheating (Termux)
3. Too many active tasks

**Solutions:**
1. Enable thermal monitoring:
```json
{
  "safety": {
    "enableThermalMonitoring": true,
    "enableBatteryMonitoring": true
  }
}
```

2. Reduce activity:
```json
{
  "playerMode": {
    "maxBlocksPerCycle": 3000    // Reduce from 5000
  }
}
```

3. Switch to AFK mode temporarily:
   - Dashboard → Switch Mode → AFK
   - Or chat command: `!mode afk`

---

## Advanced Issues

### Issue: Bot behavior not as expected

**Debug steps:**
1. Check logs in `data/logs/`
2. Enable debug logging:
```json
{
  "logging": {
    "level": "debug"
  }
}
```

3. Monitor dashboard for current activity
4. Check `!status` in-game

### Issue: Tasks not completing

**Solution:**
1. Stop current task: `!stop`
2. Check task queue: Dashboard → Tasks
3. Clear old tasks if needed (restart bot)

### Issue: Bot not responding to commands

**Common causes:**
- Wrong command prefix (must start with `!`)
- Bot in AFK mode (some commands disabled)
- Bot disconnected/reconnecting

**Solution:**
- Wait for bot to fully connect
- Check bot is online: `!status`
- Switch to player mode: `!mode player`

---

## Getting More Help

If your issue isn't listed here:

1. **Check the documentation:**
   - README.md - Main documentation
   - SETUP-GUIDE.md - Detailed setup
   - CONFIGURATION.md - All config options
   - API_REFERENCE.md - Advanced features

2. **Check console logs:**
   - Look for error messages
   - Note the timestamp of issues
   - Check `data/logs/` for detailed logs

3. **Try a clean setup:**
   ```bash
   rm -rf node_modules package-lock.json
   rm -rf data/
   npm install
   npm run setup
   npm start
   ```

4. **Verify environment:**
   - Node.js version 18+ : `node --version`
   - NPM installed: `npm --version`
   - Internet connection working
   - Server is online and accessible

---

## Version-Specific Fixes

### v2.0.1 (Current)
- ✅ Fixed launcher.js custom addon loading path
- ✅ Fixed duplicate code in launcher.js
- ✅ Improved bot survival in AFK mode
- ✅ Better threat detection and fleeing

### Updating to Latest Version
```bash
git pull origin main
npm install
npm start
```

---

**Still having issues?** Create an issue on GitHub with:
- Your Node.js version
- Operating system
- CONFIG.json (remove sensitive info)
- Console error messages
- Steps to reproduce
