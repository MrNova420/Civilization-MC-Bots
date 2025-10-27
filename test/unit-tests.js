/**
 * Unit Tests for Core Modules
 * Tests logger, safety monitor, and task manager functionality
 */

const assert = require('assert');

// Test results tracking
let passedTests = 0;
let failedTests = 0;
const testResults = [];

function test(name, fn) {
  try {
    fn();
    passedTests++;
    testResults.push(`✓ ${name}`);
    console.log(`✓ ${name}`);
  } catch (err) {
    failedTests++;
    testResults.push(`✗ ${name}: ${err.message}`);
    console.error(`✗ ${name}:`, err.message);
  }
}

console.log('\n🧪 Core Module Unit Tests');
console.log('========================\n');

// Logger Tests
console.log('Testing Logger Module...\n');

test('Logger formats messages correctly', () => {
  const Logger = require('../src/core/logger');
  const logger = new Logger({ logToFile: false });
  const formatted = logger._formatMessage('info', 'Test message', { key: 'value' });
  assert(formatted.includes('INFO'), 'Should include level');
  assert(formatted.includes('Test message'), 'Should include message');
  assert(formatted.includes('key'), 'Should include metadata');
});

test('Logger respects log levels', () => {
  const Logger = require('../src/core/logger');
  const logger = new Logger({ level: 'warn', logToFile: false });
  assert(!logger._shouldLog('debug'), 'Debug should not log at warn level');
  assert(!logger._shouldLog('info'), 'Info should not log at warn level');
  assert(logger._shouldLog('warn'), 'Warn should log at warn level');
  assert(logger._shouldLog('error'), 'Error should log at warn level');
});

test('Logger creates instances with different levels', () => {
  const Logger = require('../src/core/logger');
  const debugLogger = new Logger({ level: 'debug', logToFile: false });
  const errorLogger = new Logger({ level: 'error', logToFile: false });
  assert(debugLogger._shouldLog('debug'), 'Debug logger should log debug');
  assert(!errorLogger._shouldLog('debug'), 'Error logger should not log debug');
});

// Safety Monitor Tests
console.log('\nTesting SafetyMonitor Module...\n');

test('SafetyMonitor creates with default config', () => {
  const SafetyMonitor = require('../src/core/safety');
  const safety = new SafetyMonitor({}, null);
  assert(safety, 'SafetyMonitor should be created');
  assert(typeof safety.start === 'function', 'Should have start method');
  assert(typeof safety.stop === 'function', 'Should have stop method');
});

test('SafetyMonitor respects max CPU config', () => {
  const SafetyMonitor = require('../src/core/safety');
  const safety = new SafetyMonitor({ maxCpuPercent: 50 }, null);
  assert(safety.config.maxCpuPercent === 50, 'Should use configured max CPU');
});

test('SafetyMonitor respects max memory config', () => {
  const SafetyMonitor = require('../src/core/safety');
  const safety = new SafetyMonitor({ maxMemoryMB: 512 }, null);
  assert(safety.config.maxMemoryMB === 512, 'Should use configured max memory');
});

// Task Manager Tests
console.log('\nTesting TaskManager Module...\n');

test('TaskManager adds tasks correctly', () => {
  const TaskManager = require('../src/core/taskManager');
  const taskManager = new TaskManager({ enablePersistence: false }, null);
  const taskId = taskManager.addTask({ type: 'test', params: {} });
  assert(taskId, 'Should return task ID');
  const status = taskManager.getStatus();
  assert(status.queueLength === 1, 'Queue should have 1 task');
});

test('TaskManager removes completed tasks', () => {
  const TaskManager = require('../src/core/taskManager');
  const taskManager = new TaskManager({ enablePersistence: false }, null);
  taskManager.addTask({ type: 'test', params: {} });
  taskManager.getNextTask(); // Move task to current
  taskManager.completeTask(true); // Complete it
  const status = taskManager.getStatus();
  assert(status.queueLength === 0, 'Queue should be empty after completion');
  assert(status.currentTask === null, 'Current task should be null');
});

test('TaskManager respects max queue size', () => {
  const TaskManager = require('../src/core/taskManager');
  const taskManager = new TaskManager({ maxQueueSize: 2, enablePersistence: false }, null);
  const task1 = taskManager.addTask({ type: 'test1', params: {} });
  const task2 = taskManager.addTask({ type: 'test2', params: {} });
  const task3 = taskManager.addTask({ type: 'test3', params: {} });
  assert(task1, 'First task should be added');
  assert(task2, 'Second task should be added');
  assert(!task3, 'Third task should be rejected when queue is full');
});

test('TaskManager can pause and resume', () => {
  const TaskManager = require('../src/core/taskManager');
  const taskManager = new TaskManager({ enablePersistence: false }, null);
  taskManager.addTask({ type: 'test', params: {} });
  taskManager.pause();
  const task = taskManager.getNextTask();
  assert(task === null, 'Should return null when paused');
  taskManager.resume();
  const task2 = taskManager.getNextTask();
  assert(task2 !== null, 'Should return task when resumed');
});

// Auth Utils Tests
console.log('\nTesting Auth Utils...\n');

test('Auth utils handles offline auth correctly', () => {
  const { getAuthOptions } = require('../src/utils/auth');
  const options = getAuthOptions({ type: 'offline', username: 'TestBot' });
  assert(options.username === 'TestBot', 'Username should match');
  assert(options.auth === 'offline', 'Auth type should be offline');
});

test('Auth utils handles Microsoft auth', () => {
  const { getAuthOptions } = require('../src/utils/auth');
  const options = getAuthOptions({ type: 'microsoft', username: 'test@example.com' });
  assert(options.username === 'test@example.com', 'Email should match');
  assert(options.auth === 'microsoft', 'Auth type should be microsoft');
});

// Reconnect Manager Tests
console.log('\nTesting ReconnectManager...\n');

test('ReconnectManager creates with default config', () => {
  const ReconnectManager = require('../src/utils/reconnect');
  const reconnect = new ReconnectManager({});
  assert(reconnect, 'ReconnectManager should be created');
  assert(reconnect.maxAttempts > 0, 'Should have max attempts');
});

test('ReconnectManager calculates exponential backoff', () => {
  const ReconnectManager = require('../src/utils/reconnect');
  const reconnect = new ReconnectManager({ initialDelayMs: 1000 });
  reconnect.attempts = 0;
  const delay1 = reconnect.getDelay();
  reconnect.attempts = 1;
  const delay2 = reconnect.getDelay();
  reconnect.attempts = 2;
  const delay3 = reconnect.getDelay();
  assert(delay2 > delay1, 'Delay should increase');
  assert(delay3 > delay2, 'Delay should keep increasing');
});

test('ReconnectManager resets attempts', () => {
  const ReconnectManager = require('../src/utils/reconnect');
  const reconnect = new ReconnectManager({});
  reconnect.attempts = 5;
  reconnect.reset();
  assert(reconnect.attempts === 0, 'Attempts should be reset');
});

// Summary
console.log('\n========================');
console.log(`\n📊 Test Results: ${passedTests} passed, ${failedTests} failed\n`);

if (failedTests > 0) {
  console.log('❌ Some tests failed\n');
  process.exit(1);
} else {
  console.log('✅ All unit tests passed!\n');
  process.exit(0);
}
