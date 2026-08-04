import { Campaign } from '../models/Campaign';
import { executeCampaign } from './campaign.service';
import { logger } from '../config/logger';

let intervalId: NodeJS.Timeout | null = null;

export function initCampaignScheduler() {
  if (intervalId) return;

  logger.info('Initializing Campaign Scheduler background worker (runs every 60s)...');

  // Check every 60 seconds for campaigns that need execution
  intervalId = setInterval(async () => {
    try {
      const now = new Date();
      const dueCampaigns = await Campaign.find({
        status: 'scheduled',
        scheduledAt: { $lte: now },
      });

      for (const campaign of dueCampaigns) {
        logger.info(`Campaign Scheduler: Starting scheduled campaign ${campaign._id} (${campaign.name})`);
        executeCampaign(campaign._id.toString()).catch((err) => {
          logger.error(`Campaign Scheduler error on campaign ${campaign._id}`, err);
        });
      }
    } catch (err) {
      logger.error('Campaign Scheduler check failed', err);
    }
  }, 60000);
}
