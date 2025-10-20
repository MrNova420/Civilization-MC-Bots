/**
 * Advanced Social Interactions System
 * Handles gift-giving, teaching/learning, alliances, and conflict resolution
 */
class AdvancedSocialSystem {
  constructor(db, logger, tradingSystem) {
    this.db = db;
    this.logger = logger;
    this.tradingSystem = tradingSystem;
    
    this.MIN_TRUST_FOR_GIFT = 0.4;
    this.MIN_TRUST_FOR_TEACHING = 0.5;
    this.MIN_TRUST_FOR_ALLIANCE = 0.7;
    
    this.conflictTypes = {
      RESOURCE_DISPUTE: 'resource_dispute',
      TERRITORY_DISPUTE: 'territory_dispute',
      PERSONAL_GRIEVANCE: 'personal_grievance',
      IDEOLOGY_CLASH: 'ideology_clash'
    };
    
    this.allianceTypes = {
      MUTUAL_DEFENSE: 'mutual_defense',
      TRADE_PARTNERSHIP: 'trade_partnership',
      RESOURCE_SHARING: 'resource_sharing',
      KNOWLEDGE_EXCHANGE: 'knowledge_exchange'
    };
    
    this.skillCategories = {
      MINING: 'mining',
      BUILDING: 'building',
      FARMING: 'farming',
      COMBAT: 'combat',
      TRADING: 'trading',
      EXPLORATION: 'exploration'
    };
  }

  /**
   * Give a gift from one bot to another
   */
  giveGift(giverId, receiverId, item, message = null) {
    try {
      const relationship = this.db.getRelationship(giverId, receiverId);
      const giver = this.db.getBot(giverId);
      const receiver = this.db.getBot(receiverId);
      
      if (!giver || !receiver) {
        return { success: false, reason: 'invalid_bots' };
      }
      
      const trustLevel = relationship ? relationship.trust_level : 0.5;
      
      if (trustLevel < this.MIN_TRUST_FOR_GIFT) {
        return { success: false, reason: 'insufficient_trust' };
      }
      
      const giverPersonality = this.db.getPersonality(giverId);
      const itemValue = this.tradingSystem.getItemValue(item.name, giverPersonality);
      
      const generosityBonus = (giverPersonality.empathy || 0.5) * 0.1;
      const trustIncrease = Math.min(itemValue / 100 * 0.05 + generosityBonus, 0.2);
      const affinityIncrease = Math.min(itemValue / 100 * 0.08 + generosityBonus, 0.25);
      
      this.db.updateRelationship(giverId, receiverId, {
        affinity_change: affinityIncrease,
        trust_change: trustIncrease,
        interaction_type: 'gift_given'
      });
      
      this.db.addMemory(giverId, {
        type: 'gave_gift',
        recipient: receiverId,
        item: item,
        message: message,
        value: itemValue
      });
      
      this.db.addMemory(receiverId, {
        type: 'received_gift',
        giver: giverId,
        item: item,
        message: message,
        value: itemValue
      });
      
      this.logger.info(`[Social] ${giver.name} gave ${item.name} to ${receiver.name} (trust +${trustIncrease.toFixed(2)})`);
      
      return {
        success: true,
        trust_increase: trustIncrease,
        affinity_increase: affinityIncrease,
        item_value: itemValue
      };
    } catch (error) {
      this.logger.error('[Social] Gift-giving failed:', error.message);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Teach a skill from one bot to another
   */
  teachSkill(teacherId, studentId, skillCategory, duration = 5) {
    try {
      const relationship = this.db.getRelationship(teacherId, studentId);
      const teacher = this.db.getBot(teacherId);
      const student = this.db.getBot(studentId);
      
      if (!teacher || !student) {
        return { success: false, reason: 'invalid_bots' };
      }
      
      const trustLevel = relationship ? relationship.trust_level : 0.5;
      
      if (trustLevel < this.MIN_TRUST_FOR_TEACHING) {
        return { success: false, reason: 'insufficient_trust' };
      }
      
      const teacherSkill = this._getBotSkillLevel(teacherId, skillCategory);
      const studentSkill = this._getBotSkillLevel(studentId, skillCategory);
      
      if (teacherSkill <= studentSkill) {
        return { success: false, reason: 'teacher_not_skilled_enough' };
      }
      
      const skillGap = teacherSkill - studentSkill;
      const teacherPersonality = this.db.getPersonality(teacherId);
      const teachingEffectiveness = (teacherPersonality.empathy || 0.5) * 0.5 + (teacherPersonality.work_ethic || 0.5) * 0.3;
      
      const skillIncrease = Math.min(skillGap * 0.3 * teachingEffectiveness * (duration / 5), 0.2);
      
      this._updateBotSkill(studentId, skillCategory, skillIncrease);
      
      const bondStrength = skillIncrease * 2;
      this.db.updateRelationship(teacherId, studentId, {
        affinity_change: bondStrength * 0.15,
        trust_change: bondStrength * 0.1,
        interaction_type: 'teaching'
      });
      
      this.db.addMemory(teacherId, {
        type: 'taught_skill',
        student: studentId,
        skill: skillCategory,
        duration: duration,
        improvement: skillIncrease
      });
      
      this.db.addMemory(studentId, {
        type: 'learned_skill',
        teacher: teacherId,
        skill: skillCategory,
        duration: duration,
        improvement: skillIncrease
      });
      
      this.logger.info(`[Social] ${teacher.name} taught ${skillCategory} to ${student.name} (+${skillIncrease.toFixed(2)} skill)`);
      
      return {
        success: true,
        skill_increase: skillIncrease,
        teacher_skill: teacherSkill,
        student_new_skill: studentSkill + skillIncrease
      };
    } catch (error) {
      this.logger.error('[Social] Teaching failed:', error.message);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Form an alliance between two bots
   */
  formAlliance(bot1Id, bot2Id, allianceType, terms = {}) {
    try {
      const relationship = this.db.getRelationship(bot1Id, bot2Id);
      const bot1 = this.db.getBot(bot1Id);
      const bot2 = this.db.getBot(bot2Id);
      
      if (!bot1 || !bot2) {
        return { success: false, reason: 'invalid_bots' };
      }
      
      const trustLevel = relationship ? relationship.trust_level : 0.5;
      const affinityLevel = relationship ? relationship.affinity : 0.5;
      
      if (trustLevel < this.MIN_TRUST_FOR_ALLIANCE) {
        return { success: false, reason: 'insufficient_trust', required: this.MIN_TRUST_FOR_ALLIANCE };
      }
      
      if (affinityLevel < 0.6) {
        return { success: false, reason: 'insufficient_affinity' };
      }
      
      const allianceId = `alliance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const alliance = {
        id: allianceId,
        type: allianceType,
        bot1_id: bot1Id,
        bot2_id: bot2Id,
        formed_at: Date.now(),
        terms: terms,
        status: 'active',
        strength: (trustLevel + affinityLevel) / 2
      };
      
      this._storeAlliance(alliance);
      
      this.db.updateRelationship(bot1Id, bot2Id, {
        affinity_change: 0.15,
        trust_change: 0.1,
        interaction_type: 'alliance_formed'
      });
      
      this.db.addMemory(bot1Id, {
        type: 'alliance_formed',
        ally: bot2Id,
        alliance_type: allianceType,
        alliance_id: allianceId
      });
      
      this.db.addMemory(bot2Id, {
        type: 'alliance_formed',
        ally: bot1Id,
        alliance_type: allianceType,
        alliance_id: allianceId
      });
      
      this.logger.info(`[Social] Alliance formed between ${bot1.name} and ${bot2.name}: ${allianceType}`);
      
      return {
        success: true,
        alliance_id: allianceId,
        strength: alliance.strength
      };
    } catch (error) {
      this.logger.error('[Social] Alliance formation failed:', error.message);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Initiate conflict resolution between two bots
   */
  resolveConflict(bot1Id, bot2Id, conflictType, mediatorId = null) {
    try {
      const relationship = this.db.getRelationship(bot1Id, bot2Id);
      const bot1 = this.db.getBot(bot1Id);
      const bot2 = this.db.getBot(bot2Id);
      
      if (!bot1 || !bot2) {
        return { success: false, reason: 'invalid_bots' };
      }
      
      const bot1Personality = this.db.getPersonality(bot1Id);
      const bot2Personality = this.db.getPersonality(bot2Id);
      
      let resolutionChance = 0.5;
      
      resolutionChance += (bot1Personality.empathy || 0.5) * 0.15;
      resolutionChance += (bot2Personality.empathy || 0.5) * 0.15;
      resolutionChance -= (bot1Personality.aggression || 0.5) * 0.1;
      resolutionChance -= (bot2Personality.aggression || 0.5) * 0.1;
      
      if (mediatorId) {
        const mediator = this.db.getBot(mediatorId);
        const mediatorPersonality = this.db.getPersonality(mediatorId);
        
        if (mediator && mediatorPersonality) {
          const mediatorBonus = (mediatorPersonality.empathy || 0.5) * 0.2 + 
                               (mediatorPersonality.sociability || 0.5) * 0.15;
          resolutionChance += mediatorBonus;
          
          this.logger.info(`[Social] ${mediator.name} mediating conflict (bonus: +${mediatorBonus.toFixed(2)})`);
        }
      }
      
      if (relationship && relationship.trust_level > 0.5) {
        resolutionChance += (relationship.trust_level - 0.5) * 0.3;
      }
      
      const resolved = Math.random() < resolutionChance;
      
      if (resolved) {
        const trustRecovery = 0.1 + Math.random() * 0.1;
        const affinityRecovery = 0.05 + Math.random() * 0.05;
        
        this.db.updateRelationship(bot1Id, bot2Id, {
          affinity_change: affinityRecovery,
          trust_change: trustRecovery,
          interaction_type: 'conflict_resolved'
        });
        
        this.db.addMemory(bot1Id, {
          type: 'conflict_resolved',
          other_bot: bot2Id,
          conflict_type: conflictType,
          mediator: mediatorId,
          outcome: 'peaceful'
        });
        
        this.db.addMemory(bot2Id, {
          type: 'conflict_resolved',
          other_bot: bot1Id,
          conflict_type: conflictType,
          mediator: mediatorId,
          outcome: 'peaceful'
        });
        
        if (mediatorId) {
          this.db.addMemory(mediatorId, {
            type: 'mediated_conflict',
            bot1: bot1Id,
            bot2: bot2Id,
            conflict_type: conflictType,
            outcome: 'success'
          });
        }
        
        this.logger.info(`[Social] Conflict resolved between ${bot1.name} and ${bot2.name}`);
        
        return {
          success: true,
          resolved: true,
          resolution_chance: resolutionChance,
          trust_recovery: trustRecovery,
          affinity_recovery: affinityRecovery
        };
      } else {
        const trustDamage = 0.05 + Math.random() * 0.05;
        const affinityDamage = 0.1 + Math.random() * 0.1;
        
        this.db.updateRelationship(bot1Id, bot2Id, {
          affinity_change: -affinityDamage,
          trust_change: -trustDamage,
          interaction_type: 'conflict_escalated'
        });
        
        this.db.addMemory(bot1Id, {
          type: 'conflict_unresolved',
          other_bot: bot2Id,
          conflict_type: conflictType,
          outcome: 'escalated'
        });
        
        this.db.addMemory(bot2Id, {
          type: 'conflict_unresolved',
          other_bot: bot1Id,
          conflict_type: conflictType,
          outcome: 'escalated'
        });
        
        this.logger.warn(`[Social] Conflict escalated between ${bot1.name} and ${bot2.name}`);
        
        return {
          success: true,
          resolved: false,
          resolution_chance: resolutionChance,
          trust_damage: trustDamage,
          affinity_damage: affinityDamage
        };
      }
    } catch (error) {
      this.logger.error('[Social] Conflict resolution failed:', error.message);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Request help from another bot
   */
  requestHelp(requesterId, helperId, taskType, urgency = 0.5) {
    try {
      const relationship = this.db.getRelationship(requesterId, helperId);
      const requester = this.db.getBot(requesterId);
      const helper = this.db.getBot(helperId);
      
      if (!requester || !helper) {
        return { success: false, reason: 'invalid_bots' };
      }
      
      const trustLevel = relationship ? relationship.trust_level : 0.5;
      const affinityLevel = relationship ? relationship.affinity : 0.5;
      const helperPersonality = this.db.getPersonality(helperId);
      
      const helpfulnessScore = (helperPersonality.empathy || 0.5) * 0.4 +
                               (helperPersonality.sociability || 0.5) * 0.3 +
                               affinityLevel * 0.2 +
                               trustLevel * 0.1;
      
      const acceptanceChance = helpfulnessScore * (0.5 + urgency * 0.5);
      const accepted = Math.random() < acceptanceChance;
      
      if (accepted) {
        this.db.updateRelationship(requesterId, helperId, {
          affinity_change: 0.08,
          trust_change: 0.05,
          interaction_type: 'help_accepted'
        });
        
        this.db.addMemory(requesterId, {
          type: 'help_received',
          helper: helperId,
          task: taskType,
          urgency: urgency
        });
        
        this.db.addMemory(helperId, {
          type: 'help_provided',
          requester: requesterId,
          task: taskType,
          urgency: urgency
        });
        
        this.logger.info(`[Social] ${helper.name} accepted help request from ${requester.name}: ${taskType}`);
        
        return {
          success: true,
          accepted: true,
          helper_commitment: helpfulnessScore
        };
      } else {
        this.logger.info(`[Social] ${helper.name} declined help request from ${requester.name}`);
        
        return {
          success: true,
          accepted: false,
          acceptance_chance: acceptanceChance
        };
      }
    } catch (error) {
      this.logger.error('[Social] Help request failed:', error.message);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Share knowledge or experience between bots
   */
  shareKnowledge(sharerId, recipientId, knowledgeType, content) {
    try {
      const relationship = this.db.getRelationship(sharerId, recipientId);
      const sharer = this.db.getBot(sharerId);
      const recipient = this.db.getBot(recipientId);
      
      if (!sharer || !recipient) {
        return { success: false, reason: 'invalid_bots' };
      }
      
      const importance = this._calculateKnowledgeImportance(knowledgeType, content);
      
      this.db.addMemory(sharerId, {
        type: 'knowledge_shared',
        recipient: recipientId,
        knowledge_type: knowledgeType,
        content: content,
        importance: importance
      });
      
      this.db.addMemory(recipientId, {
        type: 'knowledge_received',
        source: sharerId,
        knowledge_type: knowledgeType,
        content: content,
        importance: importance
      });
      
      const bondStrength = importance * 0.15;
      this.db.updateRelationship(sharerId, recipientId, {
        affinity_change: bondStrength,
        trust_change: bondStrength * 0.5,
        interaction_type: 'knowledge_shared'
      });
      
      this.logger.info(`[Social] ${sharer.name} shared ${knowledgeType} knowledge with ${recipient.name}`);
      
      return {
        success: true,
        importance: importance,
        bond_strength: bondStrength
      };
    } catch (error) {
      this.logger.error('[Social] Knowledge sharing failed:', error.message);
      return { success: false, reason: error.message };
    }
  }

  // ================ HELPER METHODS ================

  _getBotSkillLevel(botId, skillCategory) {
    try {
      const memories = this.db.getRecentMemories(botId, 100);
      const relevantActions = memories.filter(m => 
        this._isSkillRelevantMemory(m.memory_type, skillCategory)
      );
      
      const baseSkill = 0.2;
      const experienceBonus = Math.min(relevantActions.length * 0.02, 0.6);
      
      return Math.min(baseSkill + experienceBonus, 1.0);
    } catch (error) {
      return 0.5;
    }
  }

  _isSkillRelevantMemory(memoryType, skillCategory) {
    const mapping = {
      mining: ['mined', 'gathered_stone', 'found_ore'],
      building: ['built', 'constructed', 'crafted'],
      farming: ['planted', 'harvested', 'farmed'],
      combat: ['fought', 'attacked', 'defended'],
      trading: ['traded', 'sold', 'bought'],
      exploration: ['explored', 'discovered', 'traveled']
    };
    
    const relevantTypes = mapping[skillCategory] || [];
    return relevantTypes.some(type => memoryType.includes(type));
  }

  _updateBotSkill(botId, skillCategory, increase) {
    this.db.addMemory(botId, {
      type: 'skill_improved',
      skill: skillCategory,
      increase: increase,
      timestamp: Date.now()
    });
  }

  _storeAlliance(alliance) {
    this.db.logEvent(
      'alliance_formed',
      `${alliance.type} alliance formed`,
      alliance.bot1_id,
      null,
      JSON.stringify(alliance)
    );
  }

  _calculateKnowledgeImportance(knowledgeType, content) {
    const importanceMap = {
      'resource_location': 0.7,
      'danger_warning': 0.9,
      'crafting_recipe': 0.6,
      'strategy': 0.75,
      'discovery': 0.85,
      'personal_experience': 0.5
    };
    
    return importanceMap[knowledgeType] || 0.5;
  }
}

module.exports = AdvancedSocialSystem;
