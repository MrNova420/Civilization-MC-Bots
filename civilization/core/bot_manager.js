const BotIntelligence = require('./bot_intelligence');
const CivilizationDatabase = require('../db/database');
const WebSocketBroker = require('./websocket_broker');
const CulturalSystem = require('./cultural_system');
const StateManager = require('./state_manager');
const BotCommunication = require('./bot_communication');
const CommunitySystem = require('./community_system');
const fs = require('fs');
const path = require('path');

class BotManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    this.db = new CivilizationDatabase(config.dbPath);
    this.wsBroker = new WebSocketBroker(config.wsPort || 8080, logger);
    this.culturalSystem = new CulturalSystem(this.db, logger);
    this.stateManager = new StateManager(config.dbPath);
    this.botComm = new BotCommunication(logger);
    this.communitySystem = new CommunitySystem(this.db, logger);
    
    this.bots = new Map();
    this.personalities = this._loadPersonalities();
    
    this.isRunning = false;
    this.civilizationUpdateInterval = null;
    
    this._setupGracefulShutdown();
  }
  
  _loadPersonalities() {
    const personalities = new Map();
    const personalitiesDir = path.join(__dirname, '../personalities');
    
    let files;
    try {
      files = fs.readdirSync(personalitiesDir);
    } catch (error) {
      this.logger.error(`[Manager] Could not read personalities directory: ${error.message}`);
      return personalities;
    }
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(personalitiesDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const personalityData = JSON.parse(fileContent);
          
          if (!personalityData.traits || !personalityData.motivation_weights) {
            this.logger.warn(`[Manager] Personality ${file} missing required fields, skipping`);
            continue;
          }
          
          const name = file.replace('.json', '');
          personalities.set(name, personalityData);
          this.logger.info(`[Manager] Loaded personality: ${name}`);
        } catch (error) {
          this.logger.error(`[Manager] Failed to load personality ${file}: ${error.message}`);
        }
      }
    }
    
    if (personalities.size === 0) {
      const error = new Error('FATAL: No valid personalities loaded! Cannot start civilization system.');
      this.logger.error(`[Manager] ${error.message}`);
      throw error;
    } else {
      this.logger.info(`[Manager] Successfully loaded ${personalities.size} personality templates`);
    }
    
    return personalities;
  }
  
  async start() {
    if (this.personalities.size === 0) {
      throw new Error('Cannot start: No personalities loaded');
    }
    
    const botsToSpawn = this.config.bots || [];
    
    if (botsToSpawn.length === 0) {
      throw new Error('Cannot start: No bots configured to spawn');
    }
    
    this.logger.info('[Manager] Starting Civilization System...');
    
    const savedState = this.stateManager.loadState();
    if (savedState) {
      this.logger.info('[Manager] Restoring previous state...');
      this.stateManager.restoreState(savedState);
    }
    
    this.wsBroker.start();
    
    this.stateManager.startAutoSave();
    
    let successfulSpawns = 0;
    
    try {
      for (const botConfig of botsToSpawn) {
        const botId = await this.spawnBot(botConfig);
        if (botId) {
          successfulSpawns++;
        }
        await this._delay(8000);
      }
      
      if (successfulSpawns === 0) {
        throw new Error(`FATAL: Failed to spawn any bots (0/${botsToSpawn.length} succeeded). Check personality configuration and Minecraft server connection.`);
      }
      
      if (successfulSpawns < botsToSpawn.length) {
        this.logger.warn(`[Manager] Only ${successfulSpawns}/${botsToSpawn.length} bots spawned successfully`);
      }
      
      this.civilizationUpdateInterval = setInterval(() => {
        this._updateCivilization();
      }, 300000);
      
      this.isRunning = true;
      this.logger.info(`[Manager] Civilization System started with ${successfulSpawns} active bots`);
      
      const progress = this.stateManager.getProgress();
      if (progress) {
        this.logger.info(`[Manager] Progress: ${progress.activeBots} active bots, ${progress.completedBuildings}/${progress.totalBuildings} buildings, ${progress.totalAchievements} achievements`);
      }
      
    } catch (error) {
      this.logger.error(`[Manager] Startup failed: ${error.message}`);
      this.stateManager.stopAutoSave();
      this.wsBroker.stop();
      for (const [botId, bot] of this.bots.entries()) {
        bot.disconnect();
      }
      this.bots.clear();
      throw error;
    }
  }
  
  async spawnBot(botConfig, retries = 2) {
    if (this.personalities.size === 0) {
      this.logger.error('[Manager] Cannot spawn bot: No personalities available');
      return null;
    }
    
    const botId = botConfig.id || `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const botName = botConfig.name || `Bot_${this.bots.size + 1}`;
    
    let personality;
    if (botConfig.personalityType && this.personalities.has(botConfig.personalityType)) {
      personality = this.personalities.get(botConfig.personalityType);
    } else {
      const personalityKeys = Array.from(this.personalities.keys());
      if (personalityKeys.length === 0) {
        this.logger.error(`[Manager] No personalities available for bot ${botName}`);
        return null;
      }
      const randomKey = personalityKeys[Math.floor(Math.random() * personalityKeys.length)];
      personality = this.personalities.get(randomKey);
    }
    
    if (!personality) {
      this.logger.error(`[Manager] Failed to get personality for bot ${botName}`);
      return null;
    }
    
    const fullConfig = {
      id: botId,
      name: botName,
      host: this.config.minecraftHost || 'localhost',
      port: this.config.minecraftPort || 25565,
      version: this.config.minecraftVersion || '1.20.1',
      personality: personality
    };
    
    // Retry logic for connection failures
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      const bot = new BotIntelligence(fullConfig, this.db, this.logger, this.wsBroker, this.botComm, this.communitySystem);
      
      const connected = await bot.connect();
      
      if (connected) {
        this.bots.set(botId, bot);
        this.logger.info(`[Manager] Bot ${botName} spawned successfully (${this.bots.size} total)`);
        return botId;
      } else {
        if (attempt < retries + 1) {
          this.logger.warn(`[Manager] Bot ${botName} connection failed (attempt ${attempt}/${retries + 1}), retrying in 2s...`);
          await this._delay(2000);
        } else {
          this.logger.error(`[Manager] Failed to spawn bot ${botName} after ${retries + 1} attempts`);
        }
      }
    }
    
    return null;
  }
  
  async removeBot(botId) {
    const bot = this.bots.get(botId);
    
    if (bot) {
      bot.disconnect();
      this.bots.delete(botId);
      this.wsBroker.unregisterBot(botId);
      
      this.logger.info(`[Manager] Bot ${botId} removed`);
      return true;
    }
    
    return false;
  }
  
  _updateCivilization() {
    const allBots = this.db.getAllBots();
    const villages = this.db.getAllVillages();
    
    this.logger.info(`[Civilization] Update - ${allBots.length} bots, ${villages.length} villages`);
    
    for (const village of villages) {
      const members = this.db.getVillageMembers(village.id);
      
      if (members.length === 0) {
        this.logger.info(`[Civilization] Village ${village.name} is abandoned`);
        this.db.logEvent('village_abandoned', `Village ${village.name} has been abandoned`, null, village.id);
      } else {
        // Update cultural development for active villages
        try {
          this.culturalSystem.identifyTraditions(village.id);
          this.culturalSystem.determineCulturalStyle(village.id);
        } catch (error) {
          this.logger.warn(`[Civilization] Cultural update failed for village ${village.name}:`, error.message);
        }
      }
    }
    
    this._checkForNaturalVillageFormation();
  }
  
  _checkForNaturalVillageFormation() {
    const allBots = this.db.getAllBots();
    
    const clusters = this._findBotClusters(allBots);
    
    for (const cluster of clusters) {
      if (cluster.bots.length >= 3) {
        const existingVillage = this._isClusterInVillage(cluster);
        
        if (!existingVillage) {
          const strongRelationships = this._checkClusterRelationships(cluster.bots);
          
          if (strongRelationships >= 2) {
            this.logger.info(`[Civilization] Natural village formation detected at cluster`);
          }
        }
      }
    }
  }
  
  _findBotClusters(bots, clusterRadius = 75) {
    const clusters = [];
    const processed = new Set();
    
    for (const bot of bots) {
      if (processed.has(bot.id) || !bot.position_x) continue;
      
      const clusterBots = [bot];
      processed.add(bot.id);
      
      for (const otherBot of bots) {
        if (processed.has(otherBot.id) || !otherBot.position_x) continue;
        
        const distance = Math.sqrt(
          Math.pow(bot.position_x - otherBot.position_x, 2) +
          Math.pow(bot.position_z - otherBot.position_z, 2)
        );
        
        if (distance <= clusterRadius) {
          clusterBots.push(otherBot);
          processed.add(otherBot.id);
        }
      }
      
      if (clusterBots.length > 1) {
        const centerX = clusterBots.reduce((sum, b) => sum + b.position_x, 0) / clusterBots.length;
        const centerZ = clusterBots.reduce((sum, b) => sum + b.position_z, 0) / clusterBots.length;
        
        clusters.push({
          center: { x: centerX, z: centerZ },
          bots: clusterBots
        });
      }
    }
    
    return clusters;
  }
  
  _isClusterInVillage(cluster) {
    const villages = this.db.getAllVillages();
    
    for (const village of villages) {
      const distance = Math.sqrt(
        Math.pow(village.center_x - cluster.center.x, 2) +
        Math.pow(village.center_z - cluster.center.z, 2)
      );
      
      if (distance < village.radius) {
        return village;
      }
    }
    
    return null;
  }
  
  _checkClusterRelationships(bots) {
    let strongRelationships = 0;
    
    for (let i = 0; i < bots.length; i++) {
      for (let j = i + 1; j < bots.length; j++) {
        const rel = this.db.getRelationship(bots[i].id, bots[j].id);
        if (rel && rel.affinity >= 0.6) {
          strongRelationships++;
        }
      }
    }
    
    return strongRelationships;
  }
  
  getAllBotsStatus() {
    const status = [];
    
    for (const [botId, bot] of this.bots.entries()) {
      status.push(bot.getStatus());
    }
    
    return status;
  }
  
  getCivilizationStatus() {
    const allBots = this.db.getAllBots();
    const villages = this.db.getAllVillages();
    const recentEvents = this.db.getRecentEvents(50);
    
    return {
      totalBots: allBots.length,
      activeBots: this.bots.size,
      villages: villages.length,
      recentEvents: recentEvents,
      uptime: process.uptime()
    };
  }
  
  async backup() {
    const backupDir = path.join(__dirname, '../../data/civilization/backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupPath = path.join(backupDir, `civilization_${timestamp}.db`);
    
    await this.db.backup(backupPath);
    
    this.logger.info(`[Manager] Database backed up to ${backupPath}`);
    return backupPath;
  }
  
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async stop() {
    this.logger.info('[Manager] Stopping Civilization System...');
    
    this.logger.info('[Manager] Saving final state...');
    this.stateManager.saveAllState();
    this.stateManager.stopAutoSave();
    
    if (this.civilizationUpdateInterval) {
      clearInterval(this.civilizationUpdateInterval);
    }
    
    for (const [botId, bot] of this.bots.entries()) {
      bot.disconnect();
    }
    
    this.bots.clear();
    
    this.wsBroker.stop();
    
    await this.backup();
    
    this.db.close();
    
    this.isRunning = false;
    this.logger.info('[Manager] Civilization System stopped');
  }
  
  _setupGracefulShutdown() {
    const shutdown = async (signal) => {
      this.logger.info(`[Manager] Received ${signal}, shutting down gracefully...`);
      await this.stop();
      process.exit(0);
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    
    process.on('uncaughtException', (error) => {
      this.logger.error(`[Manager] Uncaught exception: ${error.message}`);
      this.stateManager.saveAllState();
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error(`[Manager] Unhandled rejection: ${reason}`);
      this.stateManager.saveAllState();
    });
  }
}

module.exports = BotManager;
