/**
 * Enhanced Crafting System
 * Recipe database, material checking, progression-based crafting
 */
class CraftingSystem {
  constructor(bot, logger) {
    this.bot = bot;
    this.logger = logger;
    
    this.craftingTiers = {
      BASIC: 1,
      INTERMEDIATE: 2,
      ADVANCED: 3,
      EXPERT: 4
    };
    
    this.recipes = this._initializeRecipes();
  }

  _initializeRecipes() {
    return {
      wooden_pickaxe: {
        tier: this.craftingTiers.BASIC,
        materials: { planks: 3, stick: 2 },
        requires: ['crafting_table'],
        time: 2000,
        category: 'tools'
      },
      wooden_axe: {
        tier: this.craftingTiers.BASIC,
        materials: { planks: 3, stick: 2 },
        requires: ['crafting_table'],
        time: 2000,
        category: 'tools'
      },
      wooden_sword: {
        tier: this.craftingTiers.BASIC,
        materials: { planks: 2, stick: 1 },
        requires: ['crafting_table'],
        time: 1500,
        category: 'weapons'
      },
      stone_pickaxe: {
        tier: this.craftingTiers.BASIC,
        materials: { cobblestone: 3, stick: 2 },
        requires: ['crafting_table'],
        time: 2500,
        category: 'tools'
      },
      stone_axe: {
        tier: this.craftingTiers.BASIC,
        materials: { cobblestone: 3, stick: 2 },
        requires: ['crafting_table'],
        time: 2500,
        category: 'tools'
      },
      stone_sword: {
        tier: this.craftingTiers.BASIC,
        materials: { cobblestone: 2, stick: 1 },
        requires: ['crafting_table'],
        time: 2000,
        category: 'weapons'
      },
      iron_pickaxe: {
        tier: this.craftingTiers.INTERMEDIATE,
        materials: { iron_ingot: 3, stick: 2 },
        requires: ['crafting_table'],
        time: 3000,
        category: 'tools'
      },
      iron_axe: {
        tier: this.craftingTiers.INTERMEDIATE,
        materials: { iron_ingot: 3, stick: 2 },
        requires: ['crafting_table'],
        time: 3000,
        category: 'tools'
      },
      iron_sword: {
        tier: this.craftingTiers.INTERMEDIATE,
        materials: { iron_ingot: 2, stick: 1 },
        requires: ['crafting_table'],
        time: 2500,
        category: 'weapons'
      },
      diamond_pickaxe: {
        tier: this.craftingTiers.ADVANCED,
        materials: { diamond: 3, stick: 2 },
        requires: ['crafting_table'],
        time: 4000,
        category: 'tools'
      },
      diamond_axe: {
        tier: this.craftingTiers.ADVANCED,
        materials: { diamond: 3, stick: 2 },
        requires: ['crafting_table'],
        time: 4000,
        category: 'tools'
      },
      diamond_sword: {
        tier: this.craftingTiers.ADVANCED,
        materials: { diamond: 2, stick: 1 },
        requires: ['crafting_table'],
        time: 3500,
        category: 'weapons'
      },
      crafting_table: {
        tier: this.craftingTiers.BASIC,
        materials: { planks: 4 },
        requires: [],
        time: 1000,
        category: 'utility'
      },
      furnace: {
        tier: this.craftingTiers.BASIC,
        materials: { cobblestone: 8 },
        requires: ['crafting_table'],
        time: 2000,
        category: 'utility'
      },
      chest: {
        tier: this.craftingTiers.BASIC,
        materials: { planks: 8 },
        requires: ['crafting_table'],
        time: 1500,
        category: 'storage'
      },
      bed: {
        tier: this.craftingTiers.BASIC,
        materials: { planks: 3, wool: 3 },
        requires: ['crafting_table'],
        time: 2000,
        category: 'furniture'
      },
      torch: {
        tier: this.craftingTiers.BASIC,
        materials: { coal: 1, stick: 1 },
        requires: [],
        time: 500,
        category: 'lighting'
      },
      bread: {
        tier: this.craftingTiers.BASIC,
        materials: { wheat: 3 },
        requires: ['crafting_table'],
        time: 1000,
        category: 'food'
      },
      iron_ingot: {
        tier: this.craftingTiers.INTERMEDIATE,
        materials: { iron_ore: 1, coal: 1 },
        requires: ['furnace'],
        time: 5000,
        category: 'smelting',
        smelt: true
      },
      gold_ingot: {
        tier: this.craftingTiers.INTERMEDIATE,
        materials: { gold_ore: 1, coal: 1 },
        requires: ['furnace'],
        time: 5000,
        category: 'smelting',
        smelt: true
      },
      glass: {
        tier: this.craftingTiers.BASIC,
        materials: { sand: 1, coal: 1 },
        requires: ['furnace'],
        time: 4000,
        category: 'smelting',
        smelt: true
      },
      iron_helmet: {
        tier: this.craftingTiers.INTERMEDIATE,
        materials: { iron_ingot: 5 },
        requires: ['crafting_table'],
        time: 3000,
        category: 'armor'
      },
      iron_chestplate: {
        tier: this.craftingTiers.INTERMEDIATE,
        materials: { iron_ingot: 8 },
        requires: ['crafting_table'],
        time: 4000,
        category: 'armor'
      },
      iron_leggings: {
        tier: this.craftingTiers.INTERMEDIATE,
        materials: { iron_ingot: 7 },
        requires: ['crafting_table'],
        time: 3500,
        category: 'armor'
      },
      iron_boots: {
        tier: this.craftingTiers.INTERMEDIATE,
        materials: { iron_ingot: 4 },
        requires: ['crafting_table'],
        time: 2500,
        category: 'armor'
      },
      diamond_helmet: {
        tier: this.craftingTiers.ADVANCED,
        materials: { diamond: 5 },
        requires: ['crafting_table'],
        time: 4500,
        category: 'armor'
      },
      diamond_chestplate: {
        tier: this.craftingTiers.ADVANCED,
        materials: { diamond: 8 },
        requires: ['crafting_table'],
        time: 6000,
        category: 'armor'
      },
      diamond_leggings: {
        tier: this.craftingTiers.ADVANCED,
        materials: { diamond: 7 },
        requires: ['crafting_table'],
        time: 5500,
        category: 'armor'
      },
      diamond_boots: {
        tier: this.craftingTiers.ADVANCED,
        materials: { diamond: 4 },
        requires: ['crafting_table'],
        time: 4000,
        category: 'armor'
      },
      oak_planks: {
        tier: this.craftingTiers.BASIC,
        materials: { oak_log: 1 },
        requires: [],
        time: 500,
        category: 'building',
        output_count: 4
      },
      stick: {
        tier: this.craftingTiers.BASIC,
        materials: { planks: 2 },
        requires: [],
        time: 300,
        category: 'materials',
        output_count: 4
      },
      oak_fence: {
        tier: this.craftingTiers.BASIC,
        materials: { stick: 6, planks: 2 },
        requires: ['crafting_table'],
        time: 1500,
        category: 'building',
        output_count: 3
      },
      oak_door: {
        tier: this.craftingTiers.BASIC,
        materials: { planks: 6 },
        requires: ['crafting_table'],
        time: 1000,
        category: 'building'
      },
      bucket: {
        tier: this.craftingTiers.INTERMEDIATE,
        materials: { iron_ingot: 3 },
        requires: ['crafting_table'],
        time: 2000,
        category: 'utility'
      },
      shears: {
        tier: this.craftingTiers.BASIC,
        materials: { iron_ingot: 2 },
        requires: ['crafting_table'],
        time: 1500,
        category: 'tools'
      },
      fishing_rod: {
        tier: this.craftingTiers.BASIC,
        materials: { stick: 3, string: 2 },
        requires: ['crafting_table'],
        time: 2000,
        category: 'tools'
      },
      bow: {
        tier: this.craftingTiers.INTERMEDIATE,
        materials: { stick: 3, string: 3 },
        requires: ['crafting_table'],
        time: 2500,
        category: 'weapons'
      },
      arrow: {
        tier: this.craftingTiers.BASIC,
        materials: { flint: 1, stick: 1, feather: 1 },
        requires: ['crafting_table'],
        time: 500,
        category: 'ammunition',
        output_count: 4
      }
    };
  }

  /**
   * Check if bot can craft an item
   */
  canCraft(itemName) {
    try {
      const recipe = this.recipes[itemName];
      
      if (!recipe) {
        return { can_craft: false, reason: 'unknown_recipe' };
      }
      
      const missingRequirements = this._checkRequirements(recipe.requires);
      if (missingRequirements.length > 0) {
        return { 
          can_craft: false, 
          reason: 'missing_requirements', 
          missing: missingRequirements 
        };
      }
      
      const missingMaterials = this._checkMaterials(recipe.materials);
      if (Object.keys(missingMaterials).length > 0) {
        return { 
          can_craft: false, 
          reason: 'missing_materials', 
          missing: missingMaterials 
        };
      }
      
      return { can_craft: true, recipe: recipe };
    } catch (error) {
      this.logger.error(`[Crafting] Check failed: ${error.message}`);
      return { can_craft: false, reason: error.message };
    }
  }

  /**
   * Craft an item
   */
  async craftItem(itemName, count = 1) {
    try {
      const checkResult = this.canCraft(itemName);
      
      if (!checkResult.can_craft) {
        return { 
          success: false, 
          reason: checkResult.reason, 
          missing: checkResult.missing 
        };
      }
      
      const recipe = checkResult.recipe;
      
      this.logger.info(`[Crafting] Starting to craft ${itemName}...`);
      
      if (recipe.smelt) {
        return await this._smeltItem(itemName, recipe, count);
      } else {
        return await this._craftWithTable(itemName, recipe, count);
      }
    } catch (error) {
      this.logger.error(`[Crafting] Craft failed: ${error.message}`);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Get all craftable items based on current inventory
   */
  getCraftableItems() {
    try {
      const craftable = [];
      
      for (const [itemName, recipe] of Object.entries(this.recipes)) {
        const check = this.canCraft(itemName);
        
        if (check.can_craft) {
          craftable.push({
            name: itemName,
            tier: recipe.tier,
            category: recipe.category,
            time: recipe.time
          });
        }
      }
      
      craftable.sort((a, b) => a.tier - b.tier);
      
      return craftable;
    } catch (error) {
      this.logger.error(`[Crafting] Get craftable failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Get next craftable item by progression
   */
  getNextProgressionItem(category = null) {
    try {
      const craftable = this.getCraftableItems();
      
      let filtered = craftable;
      if (category) {
        filtered = craftable.filter(item => item.category === category);
      }
      
      if (filtered.length === 0) {
        return null;
      }
      
      return filtered[0];
    } catch (error) {
      return null;
    }
  }

  /**
   * Get recipe for an item
   */
  getRecipe(itemName) {
    return this.recipes[itemName] || null;
  }

  /**
   * Get all recipes by category
   */
  getRecipesByCategory(category) {
    const recipes = [];
    
    for (const [itemName, recipe] of Object.entries(this.recipes)) {
      if (recipe.category === category) {
        recipes.push({ name: itemName, ...recipe });
      }
    }
    
    return recipes;
  }

  /**
   * Get all recipes by tier
   */
  getRecipesByTier(tier) {
    const recipes = [];
    
    for (const [itemName, recipe] of Object.entries(this.recipes)) {
      if (recipe.tier === tier) {
        recipes.push({ name: itemName, ...recipe });
      }
    }
    
    return recipes;
  }

  // ================ HELPER METHODS ================

  _checkRequirements(requirements) {
    const missing = [];
    const inventory = this.bot.inventory.items();
    
    for (const requirement of requirements) {
      const hasRequirement = inventory.some(item => 
        item.name.includes(requirement)
      );
      
      if (!hasRequirement) {
        missing.push(requirement);
      }
    }
    
    return missing;
  }

  _checkMaterials(materials) {
    const missing = {};
    const inventory = this.bot.inventory.items();
    
    for (const [materialName, requiredCount] of Object.entries(materials)) {
      const materialItem = inventory.find(item => 
        item.name.includes(materialName)
      );
      
      const availableCount = materialItem ? materialItem.count : 0;
      
      if (availableCount < requiredCount) {
        missing[materialName] = requiredCount - availableCount;
      }
    }
    
    return missing;
  }

  async _craftWithTable(itemName, recipe, count) {
    try {
      const craftingTable = this.bot.findBlock({
        matching: block => block.name === 'crafting_table',
        maxDistance: 32
      });
      
      if (!craftingTable && recipe.requires.includes('crafting_table')) {
        return { success: false, reason: 'no_crafting_table_nearby' };
      }
      
      if (craftingTable) {
        const distance = this.bot.entity.position.distanceTo(craftingTable.position);
        if (distance > 4) {
          await this.bot.pathfinder.goto(new (require('mineflayer-pathfinder').goals.GoalNear)(
            craftingTable.position.x,
            craftingTable.position.y,
            craftingTable.position.z,
            3
          ));
        }
      }
      
      for (const [materialName, requiredCount] of Object.entries(recipe.materials)) {
        const materialItem = this.bot.inventory.items().find(item => 
          item.name.includes(materialName)
        );
        
        if (materialItem) {
          await this.bot.toss(materialItem.type, null, requiredCount * count);
        }
      }
      
      const mcData = require('minecraft-data')(this.bot.version);
      const itemData = mcData.itemsByName[itemName];
      
      if (!itemData) {
        return { success: false, reason: 'item_not_found_in_minecraft_data' };
      }
      
      await new Promise(resolve => setTimeout(resolve, recipe.time));
      
      this.logger.info(`[Crafting] Crafted ${count}x ${itemName} (consumed materials)`);
      
      return { 
        success: true, 
        item: itemName, 
        count: count * (recipe.output_count || 1),
        time: recipe.time 
      };
    } catch (error) {
      this.logger.error(`[Crafting] Table craft error: ${error.message}`);
      return { success: false, reason: error.message };
    }
  }

  async _smeltItem(itemName, recipe, count) {
    try {
      const furnace = this.bot.findBlock({
        matching: block => block.name === 'furnace' || block.name === 'blast_furnace',
        maxDistance: 32
      });
      
      if (!furnace) {
        return { success: false, reason: 'no_furnace_nearby' };
      }
      
      const distance = this.bot.entity.position.distanceTo(furnace.position);
      if (distance > 4) {
        await this.bot.pathfinder.goto(new (require('mineflayer-pathfinder').goals.GoalNear)(
          furnace.position.x,
          furnace.position.y,
          furnace.position.z,
          3
        ));
      }
      
      for (const [materialName, requiredCount] of Object.entries(recipe.materials)) {
        const materialItem = this.bot.inventory.items().find(item => 
          item.name.includes(materialName)
        );
        
        if (materialItem) {
          await this.bot.toss(materialItem.type, null, requiredCount * count);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, recipe.time * count));
      
      this.logger.info(`[Crafting] Smelted ${count}x ${itemName} (consumed materials)`);
      
      return { 
        success: true, 
        item: itemName, 
        count: count,
        time: recipe.time * count,
        method: 'smelting'
      };
    } catch (error) {
      this.logger.error(`[Crafting] Smelt error: ${error.message}`);
      return { success: false, reason: error.message };
    }
  }
}

module.exports = CraftingSystem;
