const fs = require('fs');
const path = require('path');

class StateManager {
  constructor(dbPath = './civilization/data/civilization.db') {
    this.dbPath = dbPath;
    this.stateFilePath = './civilization/data/bot_state.json';
    this.autoSaveInterval = null;
    this.saveIntervalMs = 30000;
  }

  startAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    this.autoSaveInterval = setInterval(() => {
      this.saveAllState();
    }, this.saveIntervalMs);
    
    console.log('[StateManager] Auto-save enabled (every 30 seconds)');
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  saveAllState() {
    try {
      const Database = require('better-sqlite3');
      const db = new Database(this.dbPath);
      
      const state = {
        timestamp: Date.now(),
        bots: [],
        resources: [],
        buildings: [],
        relationships: [],
        achievements: [],
        tasks: [],
        emotions: [],
        cultural_values: [],
        economic_data: []
      };

      const bots = db.prepare('SELECT * FROM bots').all();
      state.bots = bots;

      const resources = db.prepare('SELECT * FROM resources').all();
      state.resources = resources;

      const buildings = db.prepare('SELECT * FROM buildings').all();
      state.buildings = buildings;

      const relationships = db.prepare('SELECT * FROM relationships').all();
      state.relationships = relationships;

      const achievements = db.prepare('SELECT * FROM achievements').all();
      state.achievements = achievements;

      const tasks = db.prepare('SELECT * FROM tasks').all();
      state.tasks = tasks;

      const emotions = db.prepare('SELECT * FROM bot_emotions ORDER BY timestamp DESC LIMIT 1000').all();
      state.emotions = emotions;

      const culturalValues = db.prepare('SELECT * FROM cultural_values').all();
      state.cultural_values = culturalValues;

      const economicData = db.prepare('SELECT * FROM economic_transactions ORDER BY timestamp DESC LIMIT 500').all();
      state.economic_data = economicData;

      db.close();

      const stateDir = path.dirname(this.stateFilePath);
      if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
      }

      fs.writeFileSync(this.stateFilePath, JSON.stringify(state, null, 2));
      console.log(`[StateManager] State saved: ${state.bots.length} bots, ${state.resources.length} resources, ${state.buildings.length} buildings`);
      
      return true;
    } catch (error) {
      console.error('[StateManager] Error saving state:', error.message);
      return false;
    }
  }

  loadState() {
    try {
      if (!fs.existsSync(this.stateFilePath)) {
        console.log('[StateManager] No previous state found - starting fresh');
        return null;
      }

      const stateData = fs.readFileSync(this.stateFilePath, 'utf8');
      const state = JSON.parse(stateData);
      
      console.log(`[StateManager] State loaded: ${state.bots?.length || 0} bots, ${state.resources?.length || 0} resources, ${state.buildings?.length || 0} buildings`);
      
      return state;
    } catch (error) {
      console.error('[StateManager] Error loading state:', error.message);
      return null;
    }
  }

  restoreState(state) {
    if (!state) return false;

    try {
      const Database = require('better-sqlite3');
      const db = new Database(this.dbPath);

      console.log('[StateManager] Restoring state to database...');

      if (state.bots && state.bots.length > 0) {
        const insert = db.prepare(`
          INSERT OR REPLACE INTO bots (id, name, role, personality_data, status, health, hunger, xp_level, xp_points, pos_x, pos_y, pos_z, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const bot of state.bots) {
          insert.run(
            bot.id, bot.name, bot.role, bot.personality_data, bot.status,
            bot.health, bot.hunger, bot.xp_level, bot.xp_points,
            bot.pos_x, bot.pos_y, bot.pos_z, bot.created_at
          );
        }
        console.log(`[StateManager] Restored ${state.bots.length} bots`);
      }

      if (state.resources && state.resources.length > 0) {
        const insert = db.prepare(`
          INSERT OR REPLACE INTO resources (id, bot_id, resource_type, quantity, location_x, location_y, location_z, discovered_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const resource of state.resources) {
          insert.run(
            resource.id, resource.bot_id, resource.resource_type, resource.quantity,
            resource.location_x, resource.location_y, resource.location_z, resource.discovered_at
          );
        }
        console.log(`[StateManager] Restored ${state.resources.length} resources`);
      }

      if (state.buildings && state.buildings.length > 0) {
        const insert = db.prepare(`
          INSERT OR REPLACE INTO buildings (id, bot_id, building_type, pos_x, pos_y, pos_z, status, progress, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const building of state.buildings) {
          insert.run(
            building.id, building.bot_id, building.building_type,
            building.pos_x, building.pos_y, building.pos_z,
            building.status, building.progress, building.created_at
          );
        }
        console.log(`[StateManager] Restored ${state.buildings.length} buildings`);
      }

      if (state.relationships && state.relationships.length > 0) {
        const insert = db.prepare(`
          INSERT OR REPLACE INTO relationships (id, bot_id_1, bot_id_2, relationship_type, strength, last_interaction)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        for (const rel of state.relationships) {
          insert.run(
            rel.id, rel.bot_id_1, rel.bot_id_2, rel.relationship_type, rel.strength, rel.last_interaction
          );
        }
        console.log(`[StateManager] Restored ${state.relationships.length} relationships`);
      }

      if (state.achievements && state.achievements.length > 0) {
        const insert = db.prepare(`
          INSERT OR REPLACE INTO achievements (id, bot_id, achievement_type, description, timestamp)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        for (const achievement of state.achievements) {
          insert.run(
            achievement.id, achievement.bot_id, achievement.achievement_type,
            achievement.description, achievement.timestamp
          );
        }
        console.log(`[StateManager] Restored ${state.achievements.length} achievements`);
      }

      if (state.tasks && state.tasks.length > 0) {
        const insert = db.prepare(`
          INSERT OR REPLACE INTO tasks (id, bot_id, task_type, priority, status, created_at, completed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const task of state.tasks) {
          insert.run(
            task.id, task.bot_id, task.task_type, task.priority,
            task.status, task.created_at, task.completed_at
          );
        }
        console.log(`[StateManager] Restored ${state.tasks.length} tasks`);
      }

      db.close();
      console.log('[StateManager] State restoration complete');
      return true;
    } catch (error) {
      console.error('[StateManager] Error restoring state:', error.message);
      return false;
    }
  }

  getBotInventory(botId) {
    try {
      if (!fs.existsSync(this.stateFilePath)) return null;
      
      const stateData = fs.readFileSync(this.stateFilePath, 'utf8');
      const state = JSON.parse(stateData);
      
      const bot = state.bots?.find(b => b.id === botId);
      return bot ? JSON.parse(bot.personality_data || '{}').inventory : null;
    } catch (error) {
      return null;
    }
  }

  getProgress() {
    try {
      const Database = require('better-sqlite3');
      const db = new Database(this.dbPath);
      
      const stats = {
        totalBots: 0,
        activeBots: 0,
        totalResources: 0,
        totalBuildings: 0,
        completedBuildings: 0,
        totalAchievements: 0,
        totalTasks: 0,
        completedTasks: 0,
        avgBotLevel: 0
      };

      const botStats = db.prepare('SELECT COUNT(*) as total, AVG(xp_level) as avgLevel FROM bots WHERE status != "disconnected"').get();
      stats.totalBots = botStats.total;
      stats.avgBotLevel = Math.round(botStats.avgLevel || 0);

      const activeCount = db.prepare('SELECT COUNT(*) as count FROM bots WHERE status = "active"').get();
      stats.activeBots = activeCount.count;

      const resourceCount = db.prepare('SELECT COUNT(*) as count FROM resources').get();
      stats.totalResources = resourceCount.count;

      const buildingStats = db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed FROM buildings').get();
      stats.totalBuildings = buildingStats.total;
      stats.completedBuildings = buildingStats.completed;

      const achievementCount = db.prepare('SELECT COUNT(*) as count FROM achievements').get();
      stats.totalAchievements = achievementCount.count;

      const taskStats = db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed FROM tasks').get();
      stats.totalTasks = taskStats.total;
      stats.completedTasks = taskStats.completed;

      db.close();
      
      return stats;
    } catch (error) {
      console.error('[StateManager] Error getting progress:', error.message);
      return null;
    }
  }
}

module.exports = StateManager;
