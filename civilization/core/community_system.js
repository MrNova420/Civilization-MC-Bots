class CommunitySystem {
  constructor(db, logger) {
    this.db = db;
    this.logger = logger;
    this.sharedResources = new Map();
    this.communityProjects = new Map();
  }

  async shareResource(botId, resourceType, quantity, location) {
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const shareData = {
      id: shareId,
      botId: botId,
      resourceType: resourceType,
      quantity: quantity,
      location: location,
      timestamp: Date.now(),
      claimed: false
    };
    
    this.sharedResources.set(shareId, shareData);
    
    this.db.addCommunityResource(botId, resourceType, quantity, location.x, location.y, location.z);
    
    this.logger.info(`[Community] Bot ${botId} shared ${quantity} ${resourceType} at ${location.x},${location.y},${location.z}`);
    
    return shareId;
  }

  async requestResource(botId, resourceType, quantity) {
    const availableResources = [];
    
    for (const [shareId, share] of this.sharedResources.entries()) {
      if (!share.claimed && share.resourceType === resourceType && share.quantity >= quantity) {
        availableResources.push({
          shareId: shareId,
          botId: share.botId,
          location: share.location,
          quantity: share.quantity
        });
      }
    }
    
    if (availableResources.length > 0) {
      const closest = availableResources[0];
      this.logger.info(`[Community] Bot ${botId} found ${resourceType} shared by bot ${closest.botId}`);
      return closest;
    }
    
    this.logger.info(`[Community] Bot ${botId} requesting ${quantity} ${resourceType} from community`);
    this.db.addResourceRequest(botId, resourceType, quantity);
    
    return null;
  }

  claimResource(shareId, claimerBotId) {
    const share = this.sharedResources.get(shareId);
    if (share && !share.claimed) {
      share.claimed = true;
      share.claimedBy = claimerBotId;
      share.claimedAt = Date.now();
      
      this.logger.info(`[Community] Bot ${claimerBotId} claimed ${share.resourceType} from bot ${share.botId}`);
      
      return true;
    }
    return false;
  }

  async startCommunityProject(initiatorBotId, projectType, location, requiredResources) {
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const project = {
      id: projectId,
      type: projectType,
      initiator: initiatorBotId,
      location: location,
      requiredResources: requiredResources,
      contributedResources: {},
      participants: new Set([initiatorBotId]),
      status: 'planning',
      progress: 0,
      startedAt: Date.now()
    };
    
    this.communityProjects.set(projectId, project);
    
    this.db.addCommunityProject(projectId, initiatorBotId, projectType, location.x, location.y, location.z);
    
    this.logger.info(`[Community] Bot ${initiatorBotId} started community project: ${projectType}`);
    
    return projectId;
  }

  async contributeToProject(projectId, botId, resourceType, quantity) {
    const project = this.communityProjects.get(projectId);
    
    if (!project) {
      this.logger.warn(`[Community] Project ${projectId} not found`);
      return false;
    }
    
    if (!project.contributedResources[resourceType]) {
      project.contributedResources[resourceType] = 0;
    }
    
    project.contributedResources[resourceType] += quantity;
    project.participants.add(botId);
    
    const totalRequired = project.requiredResources[resourceType] || 0;
    const contributed = project.contributedResources[resourceType];
    
    this.logger.info(`[Community] Bot ${botId} contributed ${quantity} ${resourceType} to ${project.type} (${contributed}/${totalRequired})`);
    
    this._updateProjectProgress(projectId);
    
    this.db.addProjectContribution(projectId, botId, resourceType, quantity);
    
    return true;
  }

  _updateProjectProgress(projectId) {
    const project = this.communityProjects.get(projectId);
    if (!project) return;
    
    let totalProgress = 0;
    let resourceCount = 0;
    
    for (const [resourceType, required] of Object.entries(project.requiredResources)) {
      const contributed = project.contributedResources[resourceType] || 0;
      const resourceProgress = Math.min(100, (contributed / required) * 100);
      totalProgress += resourceProgress;
      resourceCount++;
    }
    
    project.progress = resourceCount > 0 ? Math.floor(totalProgress / resourceCount) : 0;
    
    if (project.progress >= 100 && project.status === 'planning') {
      project.status = 'ready';
      this.logger.info(`[Community] Project ${project.type} is ready to build!`);
    }
    
    this.db.updateProjectProgress(projectId, project.progress, project.status);
  }

  getActiveProjects() {
    const projects = [];
    for (const [projectId, project] of this.communityProjects.entries()) {
      if (project.status !== 'completed') {
        projects.push({
          id: projectId,
          type: project.type,
          initiator: project.initiator,
          participants: Array.from(project.participants),
          progress: project.progress,
          status: project.status
        });
      }
    }
    return projects;
  }

  getProjectDetails(projectId) {
    const project = this.communityProjects.get(projectId);
    if (!project) return null;
    
    return {
      id: project.id,
      type: project.type,
      location: project.location,
      requiredResources: project.requiredResources,
      contributedResources: project.contributedResources,
      participants: Array.from(project.participants),
      progress: project.progress,
      status: project.status
    };
  }

  assignTasksToBots(projectId, botIds) {
    const project = this.communityProjects.get(projectId);
    if (!project) return [];
    
    const tasks = [];
    const neededResources = [];
    
    for (const [resourceType, required] of Object.entries(project.requiredResources)) {
      const contributed = project.contributedResources[resourceType] || 0;
      if (contributed < required) {
        neededResources.push({
          type: resourceType,
          needed: required - contributed
        });
      }
    }
    
    for (let i = 0; i < botIds.length && i < neededResources.length; i++) {
      tasks.push({
        botId: botIds[i],
        task: 'gather',
        resource: neededResources[i].type,
        quantity: neededResources[i].needed,
        projectId: projectId
      });
    }
    
    return tasks;
  }

  getSharedResourcesNearby(location, radius = 50) {
    const nearby = [];
    
    for (const [shareId, share] of this.sharedResources.entries()) {
      if (share.claimed) continue;
      
      const distance = Math.sqrt(
        Math.pow(share.location.x - location.x, 2) +
        Math.pow(share.location.y - location.y, 2) +
        Math.pow(share.location.z - location.z, 2)
      );
      
      if (distance <= radius) {
        nearby.push({
          shareId: shareId,
          resourceType: share.resourceType,
          quantity: share.quantity,
          location: share.location,
          distance: Math.floor(distance)
        });
      }
    }
    
    return nearby.sort((a, b) => a.distance - b.distance);
  }

  getCommunityStats() {
    const stats = {
      totalSharedResources: this.sharedResources.size,
      activeProjects: 0,
      completedProjects: 0,
      totalContributions: 0
    };
    
    for (const project of this.communityProjects.values()) {
      if (project.status === 'completed') {
        stats.completedProjects++;
      } else {
        stats.activeProjects++;
      }
      stats.totalContributions += project.participants.size;
    }
    
    return stats;
  }
}

module.exports = CommunitySystem;
