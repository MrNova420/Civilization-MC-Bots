const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class CivilizationDatabase {
  constructor(dbPath = './data/civilization/civilization.db') {
    this.dbPath = dbPath;
    
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this._initSchema();
  }
  
  _initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bots (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_active INTEGER NOT NULL,
        position_x REAL,
        position_y REAL,
        position_z REAL,
        dimension TEXT DEFAULT 'overworld',
        health REAL DEFAULT 20,
        food INTEGER DEFAULT 20,
        level INTEGER DEFAULT 0,
        experience INTEGER DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS personalities (
        bot_id TEXT PRIMARY KEY,
        curiosity REAL DEFAULT 0.5,
        sociability REAL DEFAULT 0.5,
        ambition REAL DEFAULT 0.5,
        aggression REAL DEFAULT 0.3,
        empathy REAL DEFAULT 0.5,
        creativity REAL DEFAULT 0.5,
        risk_tolerance REAL DEFAULT 0.5,
        work_ethic REAL DEFAULT 0.5,
        FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS emotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bot_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        hunger REAL DEFAULT 0,
        safety REAL DEFAULT 1,
        loneliness REAL DEFAULT 0,
        boredom REAL DEFAULT 0,
        curiosity REAL DEFAULT 0.5,
        satisfaction REAL DEFAULT 0.5,
        stress REAL DEFAULT 0,
        FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_emotions_bot_time ON emotions(bot_id, timestamp DESC);
      
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bot_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        importance REAL DEFAULT 0.5,
        related_bot_id TEXT,
        location_x REAL,
        location_y REAL,
        location_z REAL,
        FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_memories_bot_time ON memories(bot_id, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
      
      CREATE TABLE IF NOT EXISTS relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bot_id TEXT NOT NULL,
        other_bot_id TEXT NOT NULL,
        affinity REAL DEFAULT 0,
        trust REAL DEFAULT 0,
        last_interaction INTEGER,
        interaction_count INTEGER DEFAULT 0,
        FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE,
        UNIQUE(bot_id, other_bot_id)
      );
      
      CREATE TABLE IF NOT EXISTS villages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        founded_at INTEGER NOT NULL,
        center_x REAL NOT NULL,
        center_y REAL NOT NULL,
        center_z REAL NOT NULL,
        radius REAL DEFAULT 50,
        population INTEGER DEFAULT 0,
        culture_style TEXT DEFAULT 'generic'
      );
      
      CREATE TABLE IF NOT EXISTS village_members (
        village_id TEXT NOT NULL,
        bot_id TEXT NOT NULL,
        joined_at INTEGER NOT NULL,
        role TEXT DEFAULT 'citizen',
        contribution_score REAL DEFAULT 0,
        PRIMARY KEY (village_id, bot_id),
        FOREIGN KEY (village_id) REFERENCES villages(id) ON DELETE CASCADE,
        FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        bot_id TEXT,
        village_id TEXT,
        metadata TEXT,
        FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE SET NULL,
        FOREIGN KEY (village_id) REFERENCES villages(id) ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_events_time ON events(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
      
      CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bot_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        goal_type TEXT NOT NULL,
        description TEXT NOT NULL,
        priority REAL DEFAULT 0.5,
        status TEXT DEFAULT 'active',
        completed_at INTEGER,
        metadata TEXT,
        FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_goals_bot_status ON goals(bot_id, status);
      
      CREATE TABLE IF NOT EXISTS inventory_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bot_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        inventory_data TEXT NOT NULL,
        FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS resources (
        id TEXT PRIMARY KEY,
        bot_id TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        quantity INTEGER DEFAULT 0,
        discovered_at INTEGER NOT NULL,
        location_x REAL,
        location_y REAL,
        location_z REAL,
        FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS buildings (
        id TEXT PRIMARY KEY,
        bot_id TEXT NOT NULL,
        building_type TEXT NOT NULL,
        pos_x REAL NOT NULL,
        pos_y REAL NOT NULL,
        pos_z REAL NOT NULL,
        status TEXT DEFAULT 'planning',
        progress INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bot_id TEXT NOT NULL,
        achievement_type TEXT NOT NULL,
        description TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        bot_id TEXT NOT NULL,
        task_type TEXT NOT NULL,
        priority REAL DEFAULT 0.5,
        status TEXT DEFAULT 'pending',
        created_at INTEGER NOT NULL,
        completed_at INTEGER,
        FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS bot_emotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bot_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        hunger REAL DEFAULT 0,
        safety REAL DEFAULT 1,
        loneliness REAL DEFAULT 0,
        boredom REAL DEFAULT 0,
        curiosity REAL DEFAULT 0.5,
        satisfaction REAL DEFAULT 0.5,
        stress REAL DEFAULT 0,
        FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS cultural_values (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        value_name TEXT NOT NULL,
        value_score REAL DEFAULT 0.5,
        updated_at INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS economic_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_bot_id TEXT,
        to_bot_id TEXT,
        resource_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        transaction_type TEXT DEFAULT 'trade',
        FOREIGN KEY (from_bot_id) REFERENCES bots(id) ON DELETE SET NULL,
        FOREIGN KEY (to_bot_id) REFERENCES bots(id) ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_resources_bot ON resources(bot_id);
      CREATE INDEX IF NOT EXISTS idx_buildings_bot ON buildings(bot_id);
      CREATE INDEX IF NOT EXISTS idx_achievements_bot ON achievements(bot_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_bot_status ON tasks(bot_id, status);
      CREATE INDEX IF NOT EXISTS idx_bot_emotions_bot_time ON bot_emotions(bot_id, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_economic_transactions_time ON economic_transactions(timestamp DESC);
    `);
  }
  
  createBot(botData) {
    const stmt = this.db.prepare(`
      INSERT INTO bots (id, name, username, created_at, last_active, position_x, position_y, position_z)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      botData.id,
      botData.name,
      botData.username,
      Date.now(),
      Date.now(),
      botData.x || 0,
      botData.y || 0,
      botData.z || 0
    );
    
    return result.changes > 0;
  }
  
  updateBotPosition(botId, x, y, z) {
    const stmt = this.db.prepare(`
      UPDATE bots SET position_x = ?, position_y = ?, position_z = ?, last_active = ?
      WHERE id = ?
    `);
    return stmt.run(x, y, z, Date.now(), botId);
  }
  
  updateBotStats(botId, health, food, level, experience) {
    const stmt = this.db.prepare(`
      UPDATE bots SET health = ?, food = ?, level = ?, experience = ?, last_active = ?
      WHERE id = ?
    `);
    return stmt.run(health, food, level, experience, Date.now(), botId);
  }
  
  setPersonality(botId, personality) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO personalities 
      (bot_id, curiosity, sociability, ambition, aggression, empathy, creativity, risk_tolerance, work_ethic)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      botId,
      personality.curiosity || 0.5,
      personality.sociability || 0.5,
      personality.ambition || 0.5,
      personality.aggression || 0.3,
      personality.empathy || 0.5,
      personality.creativity || 0.5,
      personality.risk_tolerance || 0.5,
      personality.work_ethic || 0.5
    );
  }
  
  getPersonality(botId) {
    const stmt = this.db.prepare('SELECT * FROM personalities WHERE bot_id = ?');
    return stmt.get(botId);
  }
  
  addEmotion(botId, emotions) {
    const stmt = this.db.prepare(`
      INSERT INTO emotions (bot_id, timestamp, hunger, safety, loneliness, boredom, curiosity, satisfaction, stress)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      botId,
      Date.now(),
      emotions.hunger || 0,
      emotions.safety || 1,
      emotions.loneliness || 0,
      emotions.boredom || 0,
      emotions.curiosity || 0.5,
      emotions.satisfaction || 0.5,
      emotions.stress || 0
    );
  }
  
  getLatestEmotions(botId) {
    const stmt = this.db.prepare(`
      SELECT * FROM emotions WHERE bot_id = ? ORDER BY timestamp DESC LIMIT 1
    `);
    return stmt.get(botId);
  }
  
  addMemory(botId, type, content, importance = 0.5, relatedBotId = null, location = null) {
    const stmt = this.db.prepare(`
      INSERT INTO memories (bot_id, timestamp, type, content, importance, related_bot_id, location_x, location_y, location_z)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      botId,
      Date.now(),
      type,
      content,
      importance,
      relatedBotId,
      location?.x || null,
      location?.y || null,
      location?.z || null
    );
  }
  
  getRecentMemories(botId, limit = 50, type = null) {
    let query = 'SELECT * FROM memories WHERE bot_id = ?';
    const params = [botId];
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }
  
  updateRelationship(botId, otherBotId, affinityChange, trustChange) {
    const existing = this.db.prepare(`
      SELECT * FROM relationships WHERE bot_id = ? AND other_bot_id = ?
    `).get(botId, otherBotId);
    
    if (existing) {
      const stmt = this.db.prepare(`
        UPDATE relationships 
        SET affinity = affinity + ?, trust = trust + ?, last_interaction = ?, interaction_count = interaction_count + 1
        WHERE bot_id = ? AND other_bot_id = ?
      `);
      return stmt.run(affinityChange, trustChange, Date.now(), botId, otherBotId);
    } else {
      const stmt = this.db.prepare(`
        INSERT INTO relationships (bot_id, other_bot_id, affinity, trust, last_interaction, interaction_count)
        VALUES (?, ?, ?, ?, ?, 1)
      `);
      return stmt.run(botId, otherBotId, affinityChange, trustChange, Date.now());
    }
  }
  
  getRelationship(botId, otherBotId) {
    const stmt = this.db.prepare(`
      SELECT * FROM relationships WHERE bot_id = ? AND other_bot_id = ?
    `);
    return stmt.get(botId, otherBotId);
  }
  
  getAllRelationships(botId) {
    const stmt = this.db.prepare(`
      SELECT r.*, b.name as other_bot_name 
      FROM relationships r
      JOIN bots b ON r.other_bot_id = b.id
      WHERE r.bot_id = ?
      ORDER BY r.affinity DESC
    `);
    return stmt.all(botId);
  }
  
  createVillage(villageData) {
    const stmt = this.db.prepare(`
      INSERT INTO villages (id, name, founded_at, center_x, center_y, center_z, radius, culture_style)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      villageData.id,
      villageData.name,
      Date.now(),
      villageData.x,
      villageData.y,
      villageData.z,
      villageData.radius || 50,
      villageData.culture || 'generic'
    );
  }
  
  addVillageMember(villageId, botId, role = 'citizen') {
    const stmt = this.db.prepare(`
      INSERT INTO village_members (village_id, bot_id, joined_at, role)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(villageId, botId, Date.now(), role);
  }
  
  getVillageMembers(villageId) {
    const stmt = this.db.prepare(`
      SELECT vm.*, b.name as bot_name
      FROM village_members vm
      JOIN bots b ON vm.bot_id = b.id
      WHERE vm.village_id = ?
    `);
    return stmt.all(villageId);
  }
  
  getAllVillages() {
    const stmt = this.db.prepare('SELECT * FROM villages');
    return stmt.all();
  }
  
  logEvent(type, description, botId = null, villageId = null, metadata = null) {
    const stmt = this.db.prepare(`
      INSERT INTO events (timestamp, type, description, bot_id, village_id, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      Date.now(),
      type,
      description,
      botId,
      villageId,
      metadata ? JSON.stringify(metadata) : null
    );
  }
  
  getRecentEvents(limit = 100, type = null) {
    let query = 'SELECT * FROM events';
    const params = [];
    
    if (type) {
      query += ' WHERE type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }
  
  addGoal(botId, goalType, description, priority = 0.5, metadata = null) {
    const stmt = this.db.prepare(`
      INSERT INTO goals (bot_id, created_at, goal_type, description, priority, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      botId,
      Date.now(),
      goalType,
      description,
      priority,
      metadata ? JSON.stringify(metadata) : null
    );
  }
  
  updateGoalStatus(goalId, status) {
    const stmt = this.db.prepare(`
      UPDATE goals SET status = ?, completed_at = ? WHERE id = ?
    `);
    return stmt.run(status, status === 'completed' ? Date.now() : null, goalId);
  }
  
  getActiveGoals(botId) {
    const stmt = this.db.prepare(`
      SELECT * FROM goals WHERE bot_id = ? AND status = 'active' ORDER BY priority DESC
    `);
    return stmt.all(botId);
  }
  
  saveInventorySnapshot(botId, inventoryData) {
    const stmt = this.db.prepare(`
      INSERT INTO inventory_snapshots (bot_id, timestamp, inventory_data)
      VALUES (?, ?, ?)
    `);
    return stmt.run(botId, Date.now(), JSON.stringify(inventoryData));
  }
  
  getAllBots() {
    const stmt = this.db.prepare('SELECT * FROM bots ORDER BY last_active DESC');
    return stmt.all();
  }
  
  getBot(botId) {
    const stmt = this.db.prepare('SELECT * FROM bots WHERE id = ?');
    return stmt.get(botId);
  }
  
  getBotByName(name) {
    const stmt = this.db.prepare('SELECT * FROM bots WHERE name = ?');
    return stmt.get(name);
  }
  
  deleteBot(botId) {
    const stmt = this.db.prepare('DELETE FROM bots WHERE id = ?');
    return stmt.run(botId);
  }
  
  addCommunityResource(botId, resourceType, quantity, x, y, z) {
    const stmt = this.db.prepare(`
      INSERT INTO resources (bot_id, resource_type, quantity, discovered_at, location_x, location_y, location_z)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(botId, resourceType, quantity, Date.now(), x, y, z);
  }
  
  addResourceRequest(botId, resourceType, quantity) {
    const stmt = this.db.prepare(`
      INSERT INTO goals (bot_id, created_at, goal_type, description, priority, status)
      VALUES (?, ?, 'resource_request', ?, 0.8, 'active')
    `);
    return stmt.run(botId, Date.now(), `Need ${quantity} ${resourceType}`);
  }
  
  addCommunityProject(projectId, initiatorBotId, projectType, x, y, z) {
    const stmt = this.db.prepare(`
      INSERT INTO buildings (id, bot_id, building_type, pos_x, pos_y, pos_z, status, progress, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'planning', 0, ?)
    `);
    return stmt.run(projectId, initiatorBotId, projectType, x, y, z, Date.now());
  }
  
  addProjectContribution(projectId, botId, resourceType, quantity) {
    const stmt = this.db.prepare(`
      INSERT INTO events (timestamp, type, description, bot_id, metadata)
      VALUES (?, 'contribution', ?, ?, ?)
    `);
    return stmt.run(
      Date.now(),
      `Contributed ${quantity} ${resourceType} to project`,
      botId,
      JSON.stringify({ projectId, resourceType, quantity })
    );
  }
  
  updateProjectProgress(projectId, progress, status) {
    const stmt = this.db.prepare(`
      UPDATE buildings SET progress = ?, status = ? WHERE id = ?
    `);
    return stmt.run(progress, status, projectId);
  }
  
  recordCraftingEvent(botName, itemName, quantity) {
    const stmt = this.db.prepare(`
      INSERT INTO events (timestamp, type, description, metadata)
      VALUES (?, 'crafting', ?, ?)
    `);
    return stmt.run(
      Date.now(),
      `${botName} crafted ${quantity}x ${itemName}`,
      JSON.stringify({ botName, itemName, quantity })
    );
  }
  
  close() {
    this.db.close();
  }
  
  backup(backupPath) {
    return this.db.backup(backupPath);
  }
}

module.exports = CivilizationDatabase;
