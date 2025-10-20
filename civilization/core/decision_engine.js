class DecisionEngine {
  constructor(db, logger) {
    this.db = db;
    this.logger = logger;
    
    this.actionTypes = {
      SURVIVAL: ['eat', 'flee', 'seek_shelter', 'heal'],
      EXPLORATION: ['explore_new_area', 'map_terrain', 'find_resources'],
      SOCIAL: ['greet_bot', 'chat', 'trade', 'help_other', 'form_alliance'],
      BUILDING: ['build_house', 'build_farm', 'build_workshop', 'build_storage', 'build_road', 'build_bridge', 'improve_home', 'craft_items', 'decorate'],
      GATHERING: ['gather_wood', 'gather_stone', 'mine_ore', 'collect_items', 'hunt_food'],
      TRADING: ['offer_trade', 'visit_market', 'share_resources'],
      RESTING: ['idle', 'sleep', 'organize_inventory', 'reflect']
    };
    
    // Map action names to actual execution parameters
    this.actionParams = {
      'build_house': { type: 'small_house', category: 'build_structure' },
      'build_farm': { type: 'farm', category: 'build_structure' },
      'build_workshop': { type: 'workshop', category: 'build_structure' },
      'build_storage': { type: 'storage_building', category: 'build_structure' },
      'build_road': { type: 'road', category: 'build_structure' },
      'build_bridge': { type: 'bridge', category: 'build_structure' },
      'gather_wood': { amount: 16, category: 'gather_wood' },
      'gather_stone': { amount: 32, category: 'gather_stone' },
      'mine_ore': { oreType: 'iron_ore', category: 'mine_ore' },
      'hunt_food': { category: 'hunt_food' },
      'explore_new_area': { distance: 50, category: 'explore' }
    };
  }
  
  calculateUtilities(botId, personality, emotions, context) {
    const utilities = {};
    
    const baseNeeds = this._evaluateBaseNeeds(emotions, context);
    const personalityFactors = this._getPersonalityFactors(personality);
    const environmentalFactors = this._evaluateEnvironment(context);
    
    for (const [category, actions] of Object.entries(this.actionTypes)) {
      const categoryKey = category.toLowerCase();
      
      let utilityScore = 0;
      
      switch(category) {
        case 'SURVIVAL':
          utilityScore = baseNeeds.survival * 2.0;
          
          // Smarter food management - eat before too hungry
          if (context.food < 6) utilityScore += 4.0; // Critical hunger
          else if (context.food < 12) utilityScore += 2.0; // Getting hungry
          else if (context.food < 16) utilityScore += 0.5; // Preventive eating
          
          // Critical health situations take highest priority
          if (context.health < 6) utilityScore += 8.0; // Almost dead!
          else if (context.health < 10) utilityScore += 4.0; // Dangerous health
          else if (context.health < 15) utilityScore += 1.5; // Low health
          
          // Safety from mobs
          if (emotions.safety < 0.3) utilityScore += 3.0;
          if (context.time === 'night' && emotions.safety < 0.5) utilityScore += 1.5;
          break;
          
        case 'EXPLORATION':
          utilityScore = (emotions.curiosity + emotions.boredom) * 0.5;
          utilityScore *= personalityFactors.curiosity;
          utilityScore *= (1 + personalityFactors.risk_tolerance * 0.3);
          if (context.time === 'day') utilityScore *= 1.2;
          break;
          
        case 'SOCIAL':
          utilityScore = emotions.loneliness * 1.5;
          utilityScore *= personalityFactors.sociability;
          if (context.nearby_bots > 0) utilityScore *= 1.5;
          if (emotions.boredom > 0.6) utilityScore += 0.3;
          break;
          
        case 'BUILDING':
          utilityScore = personalityFactors.creativity * 0.8;
          utilityScore *= personalityFactors.ambition;
          if (context.has_resources) utilityScore *= 1.3;
          if (context.in_village) utilityScore *= 1.4;
          utilityScore += (1 - emotions.stress) * 0.2;
          break;
          
        case 'GATHERING':
          utilityScore = personalityFactors.work_ethic * 0.9;
          utilityScore *= (1 - emotions.boredom);
          
          // Prioritize gathering when low on resources
          if (!context.has_resources) utilityScore *= 2.0;
          if (context.resources_nearby) utilityScore *= 1.4;
          if (context.inventory_space > 0.5) utilityScore *= 1.2;
          
          // Need food for survival
          if (context.food < 10) utilityScore += 1.0;
          break;
          
        case 'TRADING':
          utilityScore = personalityFactors.sociability * 0.6;
          if (context.has_surplus) utilityScore *= 1.5;
          if (context.nearby_bots > 0) utilityScore *= 1.3;
          if (context.in_village) utilityScore *= 1.2;
          break;
          
        case 'RESTING':
          utilityScore = emotions.stress * 0.8;
          utilityScore += (1 - personalityFactors.work_ethic) * 0.3;
          if (emotions.satisfaction > 0.7) utilityScore *= 1.2;
          if (context.time === 'night' && emotions.safety > 0.6) utilityScore *= 1.5;
          break;
      }
      
      utilityScore = Math.max(0, utilityScore);
      
      utilities[categoryKey] = {
        score: utilityScore,
        actions: actions
      };
    }
    
    return utilities;
  }
  
  selectAction(botId, personality, emotions, context) {
    const utilities = this.calculateUtilities(botId, personality, emotions, context);
    
    const entries = Object.entries(utilities);
    entries.sort((a, b) => b[1].score - a[1].score);
    
    const topCategories = entries.slice(0, 3);
    
    const randomness = 0.2;
    const roll = Math.random();
    
    let selectedCategory;
    if (roll < randomness && topCategories.length > 1) {
      selectedCategory = topCategories[Math.floor(Math.random() * Math.min(3, topCategories.length))];
    } else {
      selectedCategory = topCategories[0];
    }
    
    const [categoryName, categoryData] = selectedCategory;
    const selectedAction = categoryData.actions[Math.floor(Math.random() * categoryData.actions.length)];
    
    this.logger.info(`[Decision] Bot ${botId} chose action: ${selectedAction} (category: ${categoryName}, utility: ${categoryData.score.toFixed(2)})`);
    
    return {
      category: categoryName,
      action: selectedAction,
      utility: categoryData.score,
      allUtilities: utilities,
      params: this.getActionParams(selectedAction)
    };
  }
  
  /**
   * Get execution parameters for a given action
   */
  getActionParams(actionName) {
    return this.actionParams[actionName] || {};
  }
  
  _evaluateBaseNeeds(emotions, context) {
    return {
      survival: Math.max(
        emotions.hunger * 0.8,
        (1 - emotions.safety) * 1.0,
        context.health < 15 ? 0.9 : 0
      ),
      social: emotions.loneliness,
      stimulation: emotions.boredom
    };
  }
  
  _getPersonalityFactors(personality) {
    return {
      curiosity: personality.curiosity || 0.5,
      sociability: personality.sociability || 0.5,
      ambition: personality.ambition || 0.5,
      creativity: personality.creativity || 0.5,
      work_ethic: personality.work_ethic || 0.5,
      risk_tolerance: personality.risk_tolerance || 0.5
    };
  }
  
  _evaluateEnvironment(context) {
    return {
      safe: context.safety > 0.7,
      stimulating: context.nearby_bots > 0 || context.resources_nearby,
      productive: context.has_resources && context.inventory_space > 0.3
    };
  }
  
  updateEmotionsAfterAction(botId, action, result) {
    const currentEmotions = this.db.getLatestEmotions(botId);
    
    if (!currentEmotions) return;
    
    const updates = { ...currentEmotions };
    
    if (action.includes('eat')) {
      updates.hunger = Math.max(0, updates.hunger - 0.5);
      updates.satisfaction += 0.2;
    }
    
    if (action.includes('flee') || action.includes('shelter')) {
      updates.safety = Math.min(1, updates.safety + 0.3);
      updates.stress = Math.max(0, updates.stress - 0.2);
    }
    
    if (action.includes('explore')) {
      updates.curiosity = Math.max(0, updates.curiosity - 0.3);
      updates.boredom = Math.max(0, updates.boredom - 0.4);
      if (result === 'success') updates.satisfaction += 0.3;
    }
    
    if (action.includes('social') || action.includes('chat') || action.includes('trade')) {
      updates.loneliness = Math.max(0, updates.loneliness - 0.4);
      updates.boredom = Math.max(0, updates.boredom - 0.2);
      if (result === 'success') updates.satisfaction += 0.2;
    }
    
    if (action.includes('build') || action.includes('craft')) {
      updates.satisfaction += 0.3;
      updates.boredom = Math.max(0, updates.boredom - 0.3);
    }
    
    if (action.includes('rest') || action.includes('sleep')) {
      updates.stress = Math.max(0, updates.stress - 0.4);
      updates.boredom += 0.1;
    }
    
    updates.hunger = Math.min(1, updates.hunger + 0.05);
    updates.curiosity = Math.min(1, updates.curiosity + 0.02);
    updates.boredom = Math.min(1, updates.boredom + 0.03);
    updates.loneliness = Math.min(1, updates.loneliness + 0.02);
    
    this.db.addEmotion(botId, updates);
    
    return updates;
  }
}

module.exports = DecisionEngine;
