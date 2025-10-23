/**
 * BetterBender Config Tuner
 * Automatically tweaks CONFIG.json for stability and debug clarity.
 * Run with:  npm run tune
 */

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'CONFIG.json');
if (!fs.existsSync(file)) {
  console.error('❌ CONFIG.json not found.');
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));

// Safe improvements
cfg.safety = cfg.safety || {};
cfg.logging = cfg.logging || {};
cfg.mode = cfg.mode || {};

cfg.safety.autoThrottle = false;
cfg.safety.enableIdleMode = false;
cfg.safety.maxCpuPercent = cfg.safety.maxCpuPercent || 70;
cfg.safety.maxMemoryMB = cfg.safety.maxMemoryMB || 2048;
cfg.logging.level = 'debug';
cfg.mode.autoSwitch = false;

fs.writeFileSync(file, JSON.stringify(cfg, null, 2));
console.log('✅ CONFIG.json tuned successfully!');
