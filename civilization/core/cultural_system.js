/**
 * Cultural Development System
 * Manages traditions, shared identity, historical records, and cultural evolution
 */
class CulturalSystem {
  constructor(db, logger) {
    this.db = db;
    this.logger = logger;
    
    this.MIN_REPETITIONS_FOR_TRADITION = 5;
    this.TRADITION_MEMORY_WINDOW = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    this.culturalStyles = {
      BUILDER: 'builder',
      EXPLORER: 'explorer',
      PEACEFUL: 'peaceful',
      WARRIOR: 'warrior',
      TRADER: 'trader',
      SCHOLARLY: 'scholarly',
      AGRICULTURAL: 'agricultural'
    };
    
    this.traditionTypes = {
      DAILY_GATHERING: 'daily_gathering',
      EVENING_FEAST: 'evening_feast',
      MORNING_ASSEMBLY: 'morning_assembly',
      RESOURCE_SHARING: 'resource_sharing',
      COLLABORATIVE_BUILDING: 'collaborative_building',
      EXPLORATION_EXPEDITION: 'exploration_expedition',
      TRADE_FAIR: 'trade_fair',
      COMBAT_TRAINING: 'combat_training'
    };
  }

  /**
   * Analyze village behaviors and identify emerging traditions
   */
  identifyTraditions(villageId) {
    try {
      const members = this.db.getVillageMembers(villageId);
      const recentEvents = this._getVillageEvents(villageId, this.TRADITION_MEMORY_WINDOW);
      
      const behaviorPatterns = this._analyzeBehaviorPatterns(recentEvents);
      const traditions = [];
      
      for (const [behaviorType, occurrences] of Object.entries(behaviorPatterns)) {
        if (occurrences.length >= this.MIN_REPETITIONS_FOR_TRADITION) {
          const isRegular = this._checkRegularity(occurrences);
          
          if (isRegular) {
            traditions.push({
              type: behaviorType,
              frequency: occurrences.length,
              regularity: isRegular,
              firstOccurrence: Math.min(...occurrences),
              lastOccurrence: Math.max(...occurrences),
              participants: this._countParticipants(recentEvents, behaviorType)
            });
            
            this.logger.info(`[Culture] Village ${villageId} developed tradition: ${behaviorType}`);
          }
        }
      }
      
      this._storeTraditions(villageId, traditions);
      
      return traditions;
    } catch (error) {
      this.logger.error('[Culture] Tradition identification failed:', error.message);
      return [];
    }
  }

  /**
   * Determine village's cultural style based on dominant behaviors
   */
  determineCulturalStyle(villageId) {
    try {
      const members = this.db.getVillageMembers(villageId);
      const personalities = members.map(m => this.db.getPersonality(m.bot_id)).filter(p => p);
      
      if (personalities.length === 0) {
        return this.culturalStyles.PEACEFUL;
      }
      
      const avgTraits = {
        work_ethic: personalities.reduce((sum, p) => sum + (p.work_ethic || 0.5), 0) / personalities.length,
        curiosity: personalities.reduce((sum, p) => sum + (p.curiosity || 0.5), 0) / personalities.length,
        sociability: personalities.reduce((sum, p) => sum + (p.sociability || 0.5), 0) / personalities.length,
        aggression: personalities.reduce((sum, p) => sum + (p.aggression || 0.5), 0) / personalities.length,
        ambition: personalities.reduce((sum, p) => sum + (p.ambition || 0.5), 0) / personalities.length
      };
      
      const recentEvents = this._getVillageEvents(villageId, 7 * 24 * 60 * 60 * 1000); // 7 days
      const eventCounts = this._countEventTypes(recentEvents);
      
      let culturalStyle = this.culturalStyles.PEACEFUL;
      let maxScore = 0;
      
      const builderScore = avgTraits.work_ethic * 2 + (eventCounts.build || 0) * 0.1;
      if (builderScore > maxScore) { maxScore = builderScore; culturalStyle = this.culturalStyles.BUILDER; }
      
      const explorerScore = avgTraits.curiosity * 2 + (eventCounts.explore || 0) * 0.1;
      if (explorerScore > maxScore) { maxScore = explorerScore; culturalStyle = this.culturalStyles.EXPLORER; }
      
      const traderScore = avgTraits.ambition * 1.5 + avgTraits.sociability * 0.5 + (eventCounts.trade || 0) * 0.1;
      if (traderScore > maxScore) { maxScore = traderScore; culturalStyle = this.culturalStyles.TRADER; }
      
      const warriorScore = avgTraits.aggression * 2 + (eventCounts.combat || 0) * 0.1;
      if (warriorScore > maxScore) { maxScore = warriorScore; culturalStyle = this.culturalStyles.WARRIOR; }
      
      const agriculturalScore = avgTraits.work_ethic * 1.2 + (eventCounts.farm || 0) * 0.15;
      if (agriculturalScore > maxScore) { maxScore = agriculturalScore; culturalStyle = this.culturalStyles.AGRICULTURAL; }
      
      this.db.updateVillage(villageId, { culture_style: culturalStyle });
      
      this.logger.info(`[Culture] Village ${villageId} culture identified as: ${culturalStyle}`);
      
      return culturalStyle;
    } catch (error) {
      this.logger.error('[Culture] Cultural style determination failed:', error.message);
      return this.culturalStyles.PEACEFUL;
    }
  }

  /**
   * Record significant historical event for village
   */
  recordHistoricalEvent(villageId, eventType, description, participants = [], metadata = {}) {
    try {
      const village = this.db.getVillage(villageId);
      
      if (!village) {
        return { success: false, reason: 'village_not_found' };
      }
      
      const importance = this._calculateEventImportance(eventType, participants.length);
      
      this.db.logEvent(eventType, description, null, villageId, JSON.stringify({
        participants: participants,
        importance: importance,
        ...metadata
      }));
      
      for (const botId of participants) {
        this.db.addMemory(botId, {
          type: 'historical_event',
          village_id: villageId,
          event_type: eventType,
          description: description,
          importance: importance
        });
      }
      
      this.logger.info(`[Culture] Recorded historical event for ${village.name}: ${eventType}`);
      
      return { success: true, importance };
    } catch (error) {
      this.logger.error('[Culture] Historical event recording failed:', error.message);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Generate cultural narrative for village
   */
  generateCulturalNarrative(villageId) {
    try {
      const village = this.db.getVillage(villageId);
      const members = this.db.getVillageMembers(villageId);
      const historicalEvents = this._getVillageEvents(villageId, Infinity);
      const traditions = this._getTraditions(villageId);
      
      const foundingEvent = historicalEvents.find(e => e.type === 'village_founded');
      const foundingDate = foundingEvent ? new Date(foundingEvent.timestamp) : new Date();
      const age = Math.floor((Date.now() - foundingDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const majorEvents = historicalEvents
        .filter(e => JSON.parse(e.metadata || '{}').importance > 0.7)
        .slice(0, 10);
      
      const narrative = {
        village_name: village.name,
        founded: foundingDate.toISOString(),
        age_days: age,
        culture_style: village.culture_style || 'emerging',
        population: members.length,
        traditions: traditions.map(t => t.type),
        major_events: majorEvents.map(e => ({
          type: e.type,
          description: e.description,
          timestamp: e.timestamp
        })),
        cultural_traits: this._extractCulturalTraits(villageId),
        legacy_summary: this._generateLegacySummary(village, age, majorEvents)
      };
      
      return narrative;
    } catch (error) {
      this.logger.error('[Culture] Narrative generation failed:', error.message);
      return null;
    }
  }

  /**
   * Track cultural evolution over time
   */
  trackCulturalEvolution(villageId) {
    try {
      const currentStyle = this.db.getVillage(villageId)?.culture_style;
      const newStyle = this.determineCulturalStyle(villageId);
      
      if (currentStyle && currentStyle !== newStyle) {
        this.recordHistoricalEvent(
          villageId,
          'cultural_shift',
          `Village culture evolved from ${currentStyle} to ${newStyle}`,
          this.db.getVillageMembers(villageId).map(m => m.bot_id),
          { from: currentStyle, to: newStyle }
        );
        
        this.logger.info(`[Culture] Village ${villageId} underwent cultural shift: ${currentStyle} → ${newStyle}`);
        
        return { shifted: true, from: currentStyle, to: newStyle };
      }
      
      return { shifted: false, current: newStyle };
    } catch (error) {
      this.logger.error('[Culture] Cultural evolution tracking failed:', error.message);
      return { shifted: false, error: error.message };
    }
  }

  /**
   * Get cultural compatibility between two villages
   */
  calculateCulturalCompatibility(villageId1, villageId2) {
    try {
      const village1 = this.db.getVillage(villageId1);
      const village2 = this.db.getVillage(villageId2);
      
      if (!village1 || !village2) {
        return 0.5;
      }
      
      const traditions1 = this._getTraditions(villageId1);
      const traditions2 = this._getTraditions(villageId2);
      
      const sharedTraditions = traditions1.filter(t1 => 
        traditions2.some(t2 => t2.type === t1.type)
      ).length;
      
      const maxTraditions = Math.max(traditions1.length, traditions2.length);
      const traditionSimilarity = maxTraditions > 0 ? sharedTraditions / maxTraditions : 0.5;
      
      const styleSimilarity = village1.culture_style === village2.culture_style ? 1.0 : 0.3;
      
      const compatibility = traditionSimilarity * 0.4 + styleSimilarity * 0.6;
      
      return compatibility;
    } catch (error) {
      this.logger.error('[Culture] Compatibility calculation failed:', error.message);
      return 0.5;
    }
  }

  // ================ HELPER METHODS ================

  _getVillageEvents(villageId, timeWindow) {
    try {
      const allEvents = this.db.getRecentEvents(1000);
      const cutoff = Date.now() - timeWindow;
      
      return allEvents.filter(e => 
        e.village_id === villageId && 
        e.timestamp >= cutoff
      );
    } catch (error) {
      return [];
    }
  }

  _analyzeBehaviorPatterns(events) {
    const patterns = {};
    
    for (const event of events) {
      const behaviorType = this._mapEventToBehavior(event.type);
      
      if (behaviorType) {
        if (!patterns[behaviorType]) {
          patterns[behaviorType] = [];
        }
        patterns[behaviorType].push(event.timestamp);
      }
    }
    
    return patterns;
  }

  _mapEventToBehavior(eventType) {
    const mapping = {
      'village_goal_proposed': this.traditionTypes.DAILY_GATHERING,
      'trade_completed': this.traditionTypes.TRADE_FAIR,
      'build_completed': this.traditionTypes.COLLABORATIVE_BUILDING,
      'resource_shared': this.traditionTypes.RESOURCE_SHARING,
      'exploration_completed': this.traditionTypes.EXPLORATION_EXPEDITION
    };
    
    return mapping[eventType] || null;
  }

  _checkRegularity(timestamps) {
    if (timestamps.length < 3) return false;
    
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => 
      sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    const regularity = stdDev / avgInterval;
    
    return regularity < 0.5;
  }

  _countParticipants(events, behaviorType) {
    const participants = new Set();
    
    for (const event of events) {
      if (this._mapEventToBehavior(event.type) === behaviorType && event.bot_id) {
        participants.add(event.bot_id);
      }
    }
    
    return participants.size;
  }

  _storeTraditions(villageId, traditions) {
    for (const tradition of traditions) {
      this.db.logEvent(
        'tradition_established',
        `Village established tradition: ${tradition.type}`,
        null,
        villageId,
        JSON.stringify(tradition)
      );
    }
  }

  _getTraditions(villageId) {
    try {
      const events = this.db.getRecentEvents(100, 'tradition_established');
      return events
        .filter(e => e.village_id === villageId)
        .map(e => JSON.parse(e.metadata || '{}'))
        .filter(t => t.type);
    } catch (error) {
      return [];
    }
  }

  _countEventTypes(events) {
    const counts = {};
    
    for (const event of events) {
      const category = this._categorizeEvent(event.type);
      counts[category] = (counts[category] || 0) + 1;
    }
    
    return counts;
  }

  _categorizeEvent(eventType) {
    if (eventType.includes('build')) return 'build';
    if (eventType.includes('explore') || eventType.includes('discover')) return 'explore';
    if (eventType.includes('trade')) return 'trade';
    if (eventType.includes('combat') || eventType.includes('fight')) return 'combat';
    if (eventType.includes('farm') || eventType.includes('harvest')) return 'farm';
    return 'other';
  }

  _calculateEventImportance(eventType, participantCount) {
    const baseImportance = {
      'village_founded': 1.0,
      'cultural_shift': 0.9,
      'leader_elected': 0.85,
      'major_construction': 0.8,
      'first_trade': 0.75,
      'alliance_formed': 0.8,
      'war_declared': 0.9,
      'peace_treaty': 0.85
    };
    
    const base = baseImportance[eventType] || 0.5;
    const participationBonus = Math.min(participantCount * 0.05, 0.3);
    
    return Math.min(base + participationBonus, 1.0);
  }

  _extractCulturalTraits(villageId) {
    const members = this.db.getVillageMembers(villageId);
    const personalities = members.map(m => this.db.getPersonality(m.bot_id)).filter(p => p);
    
    if (personalities.length === 0) {
      return { communal: 0.5, industrious: 0.5, adventurous: 0.5 };
    }
    
    return {
      communal: personalities.reduce((sum, p) => sum + (p.sociability || 0.5) + (p.empathy || 0.5), 0) / (personalities.length * 2),
      industrious: personalities.reduce((sum, p) => sum + (p.work_ethic || 0.5) + (p.ambition || 0.5), 0) / (personalities.length * 2),
      adventurous: personalities.reduce((sum, p) => sum + (p.curiosity || 0.5) + (p.courage || 0.5), 0) / (personalities.length * 2)
    };
  }

  _generateLegacySummary(village, ageDays, majorEvents) {
    if (ageDays < 1) {
      return `${village.name} is a newly founded settlement, beginning its journey.`;
    }
    
    const eventCount = majorEvents.length;
    
    if (eventCount === 0) {
      return `${village.name} has existed peacefully for ${ageDays} days.`;
    }
    
    if (eventCount < 3) {
      return `${village.name}, ${ageDays} days old, is a quiet settlement with few notable events.`;
    }
    
    if (eventCount < 7) {
      return `${village.name} has grown over ${ageDays} days, with ${eventCount} significant moments shaping its identity.`;
    }
    
    return `${village.name} is a storied settlement of ${ageDays} days, rich with ${eventCount} major events that define its legacy.`;
  }
}

module.exports = CulturalSystem;
