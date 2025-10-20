class BotCommunication {
  constructor(logger) {
    this.logger = logger;
    this.activeBots = new Map();
    this.messageQueue = new Map();
    this.conversationHistory = [];
    this.coordinationRequests = new Map();
  }

  registerBot(botId, botName, botInstance) {
    this.activeBots.set(botId, {
      id: botId,
      name: botName,
      bot: botInstance,
      lastSeen: Date.now(),
      status: 'active',
      currentTask: null,
      location: null
    });
    
    this.messageQueue.set(botId, []);
    this.logger.info(`[BotComm] Bot ${botName} registered for communication`);
  }

  unregisterBot(botId) {
    this.activeBots.delete(botId);
    this.messageQueue.delete(botId);
  }

  async sendDirectMessage(fromBotId, toBotId, message, metadata = {}) {
    const fromBot = this.activeBots.get(fromBotId);
    const toBot = this.activeBots.get(toBotId);
    
    if (!fromBot || !toBot) {
      this.logger.warn(`[BotComm] Cannot send message - bot not found`);
      return false;
    }

    const messageData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: fromBotId,
      fromName: fromBot.name,
      to: toBotId,
      toName: toBot.name,
      content: message,
      metadata: metadata,
      timestamp: Date.now(),
      type: 'direct'
    };

    if (!this.messageQueue.has(toBotId)) {
      this.messageQueue.set(toBotId, []);
    }
    this.messageQueue.get(toBotId).push(messageData);
    
    this.conversationHistory.push(messageData);
    
    if (toBot.bot && toBot.bot.isConnected) {
      try {
        toBot.bot.bot.whisper(fromBot.name, message);
      } catch (e) {
        this.logger.warn(`[BotComm] Could not deliver message in-game: ${e.message}`);
      }
    }
    
    this.logger.info(`[BotComm] ${fromBot.name} -> ${toBot.name}: ${message}`);
    
    return true;
  }

  async broadcastMessage(fromBotId, message, radius = null, metadata = {}) {
    const fromBot = this.activeBots.get(fromBotId);
    if (!fromBot) return false;

    const messageData = {
      id: `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: fromBotId,
      fromName: fromBot.name,
      content: message,
      metadata: metadata,
      timestamp: Date.now(),
      type: 'broadcast',
      radius: radius
    };

    const recipients = [];

    for (const [botId, bot] of this.activeBots.entries()) {
      if (botId === fromBotId) continue;
      
      if (radius && fromBot.location && bot.location) {
        const distance = this._calculateDistance(fromBot.location, bot.location);
        if (distance > radius) continue;
      }

      if (!this.messageQueue.has(botId)) {
        this.messageQueue.set(botId, []);
      }
      this.messageQueue.get(botId).push(messageData);
      recipients.push(bot.name);
    }

    this.conversationHistory.push(messageData);

    if (fromBot.bot && fromBot.bot.isConnected) {
      try {
        fromBot.bot.bot.chat(message);
      } catch (e) {}
    }

    this.logger.info(`[BotComm] ${fromBot.name} broadcast: ${message} (${recipients.length} recipients)`);
    
    return true;
  }

  async requestHelp(botId, taskType, details = {}) {
    const bot = this.activeBots.get(botId);
    if (!bot) return null;

    const requestId = `help_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const request = {
      id: requestId,
      requesterId: botId,
      requesterName: bot.name,
      taskType: taskType,
      details: details,
      timestamp: Date.now(),
      responses: [],
      status: 'open'
    };

    this.coordinationRequests.set(requestId, request);

    await this.broadcastMessage(
      botId,
      `Need help with ${taskType}! ${details.description || ''}`,
      details.radius || null,
      { type: 'help_request', requestId: requestId, taskType: taskType }
    );

    this.logger.info(`[BotComm] ${bot.name} requested help with ${taskType}`);
    
    return requestId;
  }

  async respondToHelp(botId, requestId, response, willHelp = true) {
    const bot = this.activeBots.get(botId);
    const request = this.coordinationRequests.get(requestId);
    
    if (!bot || !request) return false;

    request.responses.push({
      botId: botId,
      botName: bot.name,
      response: response,
      willHelp: willHelp,
      timestamp: Date.now()
    });

    if (willHelp) {
      await this.sendDirectMessage(
        botId,
        request.requesterId,
        `I can help with ${request.taskType}! ${response}`,
        { type: 'help_response', requestId: requestId }
      );
    }

    this.logger.info(`[BotComm] ${bot.name} responded to help request from ${request.requesterName}`);
    
    return true;
  }

  async coordinateTask(initiatorBotId, taskType, participants = [], taskDetails = {}) {
    const initiator = this.activeBots.get(initiatorBotId);
    if (!initiator) return null;

    const coordId = `coord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const coordination = {
      id: coordId,
      initiator: initiatorBotId,
      taskType: taskType,
      participants: [initiatorBotId, ...participants],
      details: taskDetails,
      status: 'planning',
      assignments: new Map(),
      progress: 0,
      startedAt: Date.now()
    };

    this.coordinationRequests.set(coordId, coordination);

    for (const participantId of participants) {
      await this.sendDirectMessage(
        initiatorBotId,
        participantId,
        `Let's work together on ${taskType}! ${taskDetails.description || ''}`,
        { type: 'task_coordination', coordId: coordId, taskType: taskType }
      );
    }

    this.logger.info(`[BotComm] ${initiator.name} started coordination for ${taskType} with ${participants.length} bots`);
    
    return coordId;
  }

  async shareResource(botId, resourceType, quantity, location) {
    const bot = this.activeBots.get(botId);
    if (!bot) return false;

    await this.broadcastMessage(
      botId,
      `I have ${quantity} ${resourceType} to share at my location!`,
      100,
      { 
        type: 'resource_share', 
        resourceType: resourceType, 
        quantity: quantity,
        location: location
      }
    );

    this.logger.info(`[BotComm] ${bot.name} shared ${quantity} ${resourceType}`);
    
    return true;
  }

  async requestResource(botId, resourceType, quantity, urgency = 'normal') {
    const bot = this.activeBots.get(botId);
    if (!bot) return false;

    await this.broadcastMessage(
      botId,
      `Looking for ${quantity} ${resourceType}. ${urgency === 'urgent' ? 'Urgent!' : 'Can anyone help?'}`,
      null,
      { 
        type: 'resource_request', 
        resourceType: resourceType, 
        quantity: quantity,
        urgency: urgency
      }
    );

    this.logger.info(`[BotComm] ${bot.name} requested ${quantity} ${resourceType}`);
    
    return true;
  }

  getMessages(botId, limit = 10) {
    const queue = this.messageQueue.get(botId) || [];
    return queue.slice(-limit);
  }

  clearMessages(botId) {
    this.messageQueue.set(botId, []);
  }

  updateBotLocation(botId, location) {
    const bot = this.activeBots.get(botId);
    if (bot) {
      bot.location = location;
      bot.lastSeen = Date.now();
    }
  }

  updateBotTask(botId, task) {
    const bot = this.activeBots.get(botId);
    if (bot) {
      bot.currentTask = task;
    }
  }

  getNearbyBots(botId, radius = 50) {
    const bot = this.activeBots.get(botId);
    if (!bot || !bot.location) return [];

    const nearby = [];
    
    for (const [otherId, otherBot] of this.activeBots.entries()) {
      if (otherId === botId) continue;
      if (!otherBot.location) continue;

      const distance = this._calculateDistance(bot.location, otherBot.location);
      
      if (distance <= radius) {
        nearby.push({
          id: otherId,
          name: otherBot.name,
          distance: Math.floor(distance),
          location: otherBot.location,
          currentTask: otherBot.currentTask
        });
      }
    }

    return nearby.sort((a, b) => a.distance - b.distance);
  }

  getActiveBots() {
    const bots = [];
    for (const [id, bot] of this.activeBots.entries()) {
      bots.push({
        id: id,
        name: bot.name,
        status: bot.status,
        currentTask: bot.currentTask,
        location: bot.location
      });
    }
    return bots;
  }

  getConversationHistory(limit = 50) {
    return this.conversationHistory.slice(-limit);
  }

  getActiveCoordinations() {
    const active = [];
    for (const [id, coord] of this.coordinationRequests.entries()) {
      if (coord.status !== 'completed') {
        active.push({
          id: id,
          type: coord.taskType || 'help',
          initiator: this.activeBots.get(coord.requesterId || coord.initiator)?.name,
          participants: coord.participants?.length || coord.responses?.length || 0,
          status: coord.status
        });
      }
    }
    return active;
  }

  _calculateDistance(loc1, loc2) {
    return Math.sqrt(
      Math.pow(loc1.x - loc2.x, 2) +
      Math.pow(loc1.y - loc2.y, 2) +
      Math.pow(loc1.z - loc2.z, 2)
    );
  }
}

module.exports = BotCommunication;
