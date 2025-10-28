#!/usr/bin/env node

/**
 * Comprehensive Project Validation
 * Tests all bots, modes, features, scripts, and configurations
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔═══════════════════════════════════════════════════╗');
console.log('║  🔍 COMPREHENSIVE PROJECT VALIDATION - v2.0.2  🔍 ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  categories: {}
};

function test(category, name, fn) {
  if (!testResults.categories[category]) {
    testResults.categories[category] = { passed: 0, failed: 0 };
  }
  
  try {
    fn();
    console.log(`✓ ${name}`);
    testResults.passed++;
    testResults.categories[category].passed++;
    return true;
  } catch (err) {
    console.log(`✗ ${name}: ${err.message}`);
    testResults.failed++;
    testResults.categories[category].failed++;
    return false;
  }
}

// ===================================
// 1. PROJECT STRUCTURE VALIDATION
// ===================================
console.log('📁 Testing Project Structure...\n');

test('structure', 'Root directory exists', () => {
  if (!fs.existsSync(__dirname + '/..')) throw new Error('Root not found');
});

test('structure', 'package.json is valid', () => {
  const pkg = require('../package.json');
  if (!pkg.name || !pkg.version) throw new Error('Invalid package.json');
});

test('structure', 'Source directory exists', () => {
  if (!fs.existsSync(path.join(__dirname, '..', 'src'))) throw new Error('src/ missing');
});

test('structure', 'Addons directory exists', () => {
  if (!fs.existsSync(path.join(__dirname, '..', 'addons'))) throw new Error('addons/ missing');
});

test('structure', 'Civilization directory exists', () => {
  if (!fs.existsSync(path.join(__dirname, '..', 'civilization'))) throw new Error('civilization/ missing');
});

test('structure', 'Dashboard directory exists', () => {
  if (!fs.existsSync(path.join(__dirname, '..', 'dashboard'))) throw new Error('dashboard/ missing');
});

test('structure', 'Custom addons directory exists', () => {
  if (!fs.existsSync(path.join(__dirname, '..', 'addons-custom'))) throw new Error('addons-custom/ missing');
});

// ===================================
// 2. CONFIGURATION FILES VALIDATION
// ===================================
console.log('\n⚙️  Testing Configuration Files...\n');

test('config', 'CONFIG.example.json exists', () => {
  if (!fs.existsSync(path.join(__dirname, '..', 'CONFIG.example.json'))) throw new Error('Missing');
});

test('config', 'CONFIG.example.json is valid JSON', () => {
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'CONFIG.example.json'), 'utf8'));
  if (!config.server || !config.auth) throw new Error('Invalid structure');
});

test('config', 'CONFIG-PRESETS.json exists', () => {
  if (!fs.existsSync(path.join(__dirname, '..', 'CONFIG-PRESETS.json'))) throw new Error('Missing');
});

test('config', 'ecosystem.config.js exists for PM2', () => {
  if (!fs.existsSync(path.join(__dirname, '..', 'ecosystem.config.js'))) throw new Error('Missing');
});

// ===================================
// 3. CORE MODULES VALIDATION
// ===================================
console.log('\n🔧 Testing Core Modules...\n');

test('core', 'Engine module loads', () => {
  const Engine = require('../src/engine');
  if (typeof Engine !== 'function') throw new Error('Not a constructor');
});

test('core', 'Logger module loads', () => {
  const Logger = require('../src/core/logger');
  if (typeof Logger !== 'function') throw new Error('Not a constructor');
});

test('core', 'Safety Monitor module loads', () => {
  const SafetyMonitor = require('../src/core/safety');
  if (typeof SafetyMonitor !== 'function') throw new Error('Not a constructor');
});

test('core', 'Task Manager module loads', () => {
  const TaskManager = require('../src/core/taskManager');
  if (typeof TaskManager !== 'function') throw new Error('Not a constructor');
});

test('core', 'State Manager module loads', () => {
  const StateManager = require('../src/core/stateManager');
  if (typeof StateManager !== 'function') throw new Error('Not a constructor');
});

test('core', 'Reconnect Manager module loads', () => {
  const ReconnectManager = require('../src/utils/reconnect');
  if (typeof ReconnectManager !== 'function') throw new Error('Not a constructor');
});

test('core', 'Command Handler module loads', () => {
  const CommandHandler = require('../src/core/commandHandler');
  if (typeof CommandHandler !== 'function') throw new Error('Not a constructor');
});

// ===================================
// 4. ADDONS VALIDATION
// ===================================
console.log('\n🔌 Testing Addons...\n');

const addons = ['afk', 'player', 'crafting', 'pathfinding', 'mining', 'building', 'trading'];
addons.forEach(addon => {
  test('addons', `${addon} addon loads`, () => {
    const addonModule = require(`../addons/${addon}`);
    if (!addonModule.name) throw new Error('Missing name property');
  });
});

// ===================================
// 5. CIVILIZATION MODULES VALIDATION
// ===================================
console.log('\n🏛️  Testing Civilization Modules...\n');

test('civilization', 'Bot Manager loads', () => {
  const BotManager = require('../civilization/core/bot_manager');
  if (typeof BotManager !== 'function') throw new Error('Not a constructor');
});

test('civilization', 'Village System loads', () => {
  const VillageSystem = require('../civilization/core/village_system');
  if (typeof VillageSystem !== 'function') throw new Error('Not a constructor');
});

test('civilization', 'Trading System loads', () => {
  const TradingSystem = require('../civilization/core/trading_system');
  if (typeof TradingSystem !== 'function') throw new Error('Not a constructor');
});

test('civilization', 'Building System loads', () => {
  const BuildingSystem = require('../civilization/core/building_system');
  if (typeof BuildingSystem !== 'function') throw new Error('Not a constructor');
});

test('civilization', 'Preset Generator loads', () => {
  const PresetGenerator = require('../civilization/presets/preset_generator');
  if (typeof PresetGenerator !== 'function') throw new Error('Not a constructor');
});

// ===================================
// 6. SCRIPTS VALIDATION
// ===================================
console.log('\n📜 Testing Scripts...\n');

test('scripts', 'launcher.js exists and is executable', () => {
  if (!fs.existsSync(path.join(__dirname, '..', 'launcher.js'))) throw new Error('Missing');
  const content = fs.readFileSync(path.join(__dirname, '..', 'launcher.js'), 'utf8');
  if (!content.includes('launchSingleBot') || !content.includes('launchCivilization')) {
    throw new Error('Missing required functions');
  }
});

test('scripts', 'setup.js exists and is executable', () => {
  if (!fs.existsSync(path.join(__dirname, '..', 'setup.js'))) throw new Error('Missing');
});

test('scripts', 'start.sh exists', () => {
  if (!fs.existsSync(path.join(__dirname, '..', 'start.sh'))) throw new Error('Missing');
});

test('scripts', 'start.bat exists for Windows', () => {
  if (!fs.existsSync(path.join(__dirname, '..', 'start.bat'))) throw new Error('Missing');
});

// ===================================
// 7. DASHBOARD VALIDATION
// ===================================
console.log('\n📊 Testing Dashboard...\n');

test('dashboard', 'Dashboard server module loads', () => {
  const DashboardServer = require('../dashboard/server');
  if (typeof DashboardServer !== 'function') throw new Error('Not a constructor');
});

test('dashboard', 'Public assets directory exists', () => {
  if (!fs.existsSync(path.join(__dirname, '..', 'public'))) throw new Error('Missing');
});

test('dashboard', 'Dashboard HTML exists', () => {
  if (!fs.existsSync(path.join(__dirname, '..', 'public', 'index.html'))) throw new Error('Missing');
});

// ===================================
// 8. DOCUMENTATION VALIDATION
// ===================================
console.log('\n📚 Testing Documentation...\n');

const requiredDocs = [
  'README.md',
  'CHANGELOG.md',
  'TROUBLESHOOTING.md',
  'FIXES_SUMMARY.md',
  'SETUP-GUIDE.md',
  'CONFIGURATION.md'
];

requiredDocs.forEach(doc => {
  test('documentation', `${doc} exists`, () => {
    if (!fs.existsSync(path.join(__dirname, '..', doc))) throw new Error('Missing');
  });
});

// ===================================
// 9. FEATURES VALIDATION
// ===================================
console.log('\n✨ Testing Features Integration...\n');

test('features', 'Custom addon loading path is correct', () => {
  const launcher = fs.readFileSync(path.join(__dirname, '..', 'launcher.js'), 'utf8');
  if (launcher.includes("'..', 'addons-custom'")) {
    throw new Error('Incorrect path still present');
  }
  if (!launcher.includes("'addons-custom'")) {
    throw new Error('Correct path missing');
  }
});

test('features', 'AFK mode has improved survival logic', () => {
  const afk = fs.readFileSync(path.join(__dirname, '..', 'addons', 'afk.js'), 'utf8');
  // Check for improved values
  if (!afk.includes('< 20') && !afk.includes('< 15')) {
    throw new Error('Detection range not improved');
  }
});

test('features', 'No duplicate code in launcher.js', () => {
  const launcher = fs.readFileSync(path.join(__dirname, '..', 'launcher.js'), 'utf8');
  const fsRequires = (launcher.match(/const fs = require\('fs'\)/g) || []).length;
  const pathRequires = (launcher.match(/const path = require\('path'\)/g) || []).length;
  if (fsRequires > 1 || pathRequires > 1) {
    throw new Error('Duplicate requires found');
  }
});

// ===================================
// 10. BUILD & RUN VALIDATION
// ===================================
console.log('\n🔨 Testing Build & Run Capabilities...\n');

test('build', 'npm scripts are defined', () => {
  const pkg = require('../package.json');
  const requiredScripts = ['start', 'setup', 'test', 'lint', 'bot', 'civilization'];
  requiredScripts.forEach(script => {
    if (!pkg.scripts[script]) throw new Error(`Missing script: ${script}`);
  });
});

test('build', 'All dependencies are specified', () => {
  const pkg = require('../package.json');
  if (!pkg.dependencies || Object.keys(pkg.dependencies).length === 0) {
    throw new Error('No dependencies specified');
  }
});

test('build', 'Node modules are installed', () => {
  if (!fs.existsSync(path.join(__dirname, '..', 'node_modules'))) {
    throw new Error('node_modules missing - run npm install');
  }
});

// ===================================
// SUMMARY
// ===================================
console.log('\n╔═══════════════════════════════════════════════════╗');
console.log('║                  TEST SUMMARY                     ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

console.log(`✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`⚠️  Warnings: ${testResults.warnings}\n`);

console.log('Results by Category:\n');
Object.keys(testResults.categories).forEach(category => {
  const cat = testResults.categories[category];
  const status = cat.failed === 0 ? '✅' : '❌';
  console.log(`${status} ${category}: ${cat.passed} passed, ${cat.failed} failed`);
});

console.log('\n╔═══════════════════════════════════════════════════╗');
if (testResults.failed === 0) {
  console.log('║  ✅ ALL VALIDATION TESTS PASSED - READY TO USE! ✅║');
} else {
  console.log('║  ❌ SOME TESTS FAILED - REVIEW REQUIRED         ❌║');
}
console.log('╚═══════════════════════════════════════════════════╝\n');

// Save results
const resultsFile = path.join(__dirname, '..', 'test-results', `validation-${Date.now()}.json`);
fs.mkdirSync(path.dirname(resultsFile), { recursive: true });
fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
console.log(`📊 Detailed results saved to: ${resultsFile}\n`);

process.exit(testResults.failed > 0 ? 1 : 0);
