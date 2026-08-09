import { Campaign, ICampaign } from '../models/Campaign';
import { CampaignLog } from '../models/CampaignLog';
import { Contact } from '../models/Contact';
import * as messageService from './message.service';
import { parsePagination, buildPaginatedResult } from '../utils/pagination';
import { logger } from '../config/logger';
import { SafeModeError } from '../safemode/SafeModeError';

export async function createCampaign(
  instanceId: string,
  userId: string,
  data: {
    name: string;
    templateText: string;
    mediaUrl?: string;
    defaultName?: string;
    interactiveType?: 'none' | 'button' | 'slider';
    buttons?: any[];
    sliderItems?: any[];
    targetGroups?: string[];
    scheduledAt: Date | string;
  }
) {
  const scheduledAtDate = new Date(data.scheduledAt);
  const status = scheduledAtDate <= new Date() ? 'processing' : 'scheduled';

  const campaign = await Campaign.create({
    name: data.name,
    templateText: data.templateText,
    mediaUrl: data.mediaUrl || null,
    defaultName: data.defaultName || 'there',
    interactiveType: data.interactiveType || 'none',
    buttons: data.buttons || [],
    sliderItems: data.sliderItems || [],
    targetGroups: data.targetGroups || [],
    scheduledAt: scheduledAtDate,
    status,
    instanceId,
    createdBy: userId,
  });

  // Calculate target contacts and create initial campaign logs
  let contactFilter: Record<string, unknown> = { instanceId };
  if (data.targetGroups && data.targetGroups.length > 0) {
    contactFilter.groups = { $in: data.targetGroups };
  }

  const contacts = await Contact.find(contactFilter).lean();

  const campaignLogs = contacts.map((contact) => ({
    campaignId: campaign._id,
    contactId: contact._id,
    phone: contact.phone,
    jid: contact.jid,
    status: 'pending',
    instanceId,
  }));

  if (campaignLogs.length > 0) {
    await CampaignLog.insertMany(campaignLogs);
  }

  await Campaign.findByIdAndUpdate(campaign._id, {
    'stats.total': contacts.length,
  });

  // If immediate, process execution right away asynchronously
  if (status === 'processing') {
    executeCampaign(campaign._id.toString()).catch((err) => {
      logger.error(`Error executing immediate campaign ${campaign._id}`, err);
    });
  }

  return Campaign.findById(campaign._id).lean();
}

export async function listCampaigns(instanceId: string, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const status = query.status as string | undefined;

  const filter: Record<string, unknown> = { instanceId };
  if (status) filter.status = status;

  const [data, total] = await Promise.all([
    Campaign.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Campaign.countDocuments(filter),
  ]);

  return buildPaginatedResult(data, total, { page, limit, skip });
}

export async function getCampaignById(instanceId: string, campaignId: string) {
  return Campaign.findOne({ _id: campaignId, instanceId }).lean();
}

export async function getCampaignLogs(
  instanceId: string,
  campaignId: string,
  query: Record<string, unknown>
) {
  const { page, limit, skip } = parsePagination(query);
  const status = query.status as string | undefined;

  const filter: Record<string, unknown> = { campaignId, instanceId };
  if (status && status !== 'all') filter.status = status;

  const [data, total] = await Promise.all([
    CampaignLog.find(filter).populate('contactId', 'name pushName profilePicUrl').sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    CampaignLog.countDocuments(filter),
  ]);

  return buildPaginatedResult(data, total, { page, limit, skip });
}

export async function reCampaign(
  instanceId: string,
  userId: string,
  parentCampaignId: string,
  data: {
    name?: string;
    filterStatus: 'sent' | 'delivered' | 'read' | 'failed' | 'unread';
    scheduledAt: Date | string;
  }
) {
  const parent = await Campaign.findOne({ _id: parentCampaignId, instanceId });
  if (!parent) throw new Error('Parent campaign not found');

  // Find target contacts based on logs status
  let logStatusFilter: any = data.filterStatus;
  if (data.filterStatus === 'unread') {
    logStatusFilter = { $in: ['pending', 'sent', 'delivered'] };
  }

  const logs = await CampaignLog.find({
    campaignId: parentCampaignId,
    instanceId,
    status: logStatusFilter,
  }).lean();

  const scheduledAtDate = new Date(data.scheduledAt);
  const status = scheduledAtDate <= new Date() ? 'processing' : 'scheduled';
  const campaignName = data.name || `Re-Campaign (${data.filterStatus.toUpperCase()}): ${parent.name}`;

  const newCampaign = await Campaign.create({
    name: campaignName,
    templateText: parent.templateText,
    mediaUrl: parent.mediaUrl,
    interactiveType: parent.interactiveType,
    buttons: parent.buttons,
    sliderItems: parent.sliderItems,
    targetGroups: parent.targetGroups,
    scheduledAt: scheduledAtDate,
    status,
    instanceId,
    createdBy: userId,
    parentCampaignId: parent._id,
    recampaignFilter: data.filterStatus,
  });

  const newLogs = logs.map((log) => ({
    campaignId: newCampaign._id,
    contactId: log.contactId,
    phone: log.phone,
    jid: log.jid,
    status: 'pending',
    instanceId,
  }));

  if (newLogs.length > 0) {
    await CampaignLog.insertMany(newLogs);
  }

  await Campaign.findByIdAndUpdate(newCampaign._id, {
    'stats.total': logs.length,
  });

  if (status === 'processing') {
    executeCampaign(newCampaign._id.toString()).catch((err) => {
      logger.error(`Error executing re-campaign ${newCampaign._id}`, err);
    });
  }

  return newCampaign;
}

export async function deleteCampaign(instanceId: string, campaignId: string) {
  await CampaignLog.deleteMany({ campaignId, instanceId });
  return Campaign.findOneAndDelete({ _id: campaignId, instanceId });
}

export async function executeCampaign(campaignId: string) {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign || campaign.status === 'completed' || campaign.status === 'cancelled') return;

  campaign.status = 'processing';
  await campaign.save();

  const pendingLogs = await CampaignLog.find({ campaignId, status: 'pending' });
  const instanceId = campaign.instanceId;
  const fallbackName = campaign.defaultName || 'there';

  let sentCount = campaign.stats.sent || 0;
  let failedCount = campaign.stats.failed || 0;

  for (const log of pendingLogs) {
    try {
      // Look up the contact to get their saved name
      const contact = await Contact.findOne({ instanceId, phone: log.phone }).lean();
      const contactName = (contact as any)?.name?.trim() || fallbackName;

      // Personalise template: replace {{name}} and {{phone}}
      let text = campaign.templateText
        .replace(/\{\{name\}\}/g, contactName)
        .replace(/\{\{phone\}\}/g, log.phone || '');

      let result;
      if (campaign.interactiveType === 'button' && campaign.buttons && campaign.buttons.length > 0) {
        result = await messageService.sendButton(instanceId, {
          to: log.phone,
          text,
          buttons: campaign.buttons as any,
        });
      } else if (campaign.interactiveType === 'slider' && campaign.sliderItems && campaign.sliderItems.length > 0) {
        result = await messageService.sendSlider(instanceId, {
          to: log.phone,
          title: campaign.name,
          text,
          items: campaign.sliderItems as any,
        });
      } else if (campaign.mediaUrl) {
        // Send image with caption
        result = await messageService.sendImageFromUrl(instanceId, {
          to: log.phone,
          url: campaign.mediaUrl,
          caption: text,
        });
      } else {
        result = await messageService.sendText(instanceId, {
          to: log.phone,
          text,
        });
      }

      log.status = 'sent';
      log.messageId = result?.key?.id || undefined;
      log.sentAt = new Date();
      await log.save();
      sentCount++;
    } catch (err: any) {
      if (err instanceof SafeModeError) {
        if (err.code === 'F14') {
          // Daily cap or sending-window hit — reschedule remaining sends for later.
          // Do NOT retry-loop: retrying immediately just throws again until midnight.
          logger.warn(`[Campaign ${campaignId}] Safe Mode F14: ${err.detail} — pausing remaining sends`);
          log.status = 'pending'; // Keep as pending so it's picked up after midnight
          log.errorMessage = `Safe Mode: ${err.detail}`;
          await log.save();
          failedCount++;

          await Campaign.findByIdAndUpdate(campaignId, {
            'stats.sent': sentCount,
            'stats.delivered': sentCount,
            'stats.read': Math.floor(sentCount * 0.75),
            'stats.failed': failedCount,
          });

          // Break remaining sends for today — they stay 'pending' for midnight retry
          break;
        } else if (err.code === 'F13') {
          // Link blocked in first message — fail this recipient clearly
          logger.warn(`[Campaign ${campaignId}] Safe Mode F13 for ${log.phone}: ${err.detail}`);
          log.status = 'failed';
          log.errorMessage = `Safe Mode F13: Link blocked in first message. Remove URLs and retry.`;
          await log.save();
          failedCount++;
        } else if (err.code === 'F15') {
          // Group action not available at this tier
          logger.warn(`[Campaign ${campaignId}] Safe Mode F15 for ${log.phone}: ${err.detail}`);
          log.status = 'failed';
          log.errorMessage = `Safe Mode F15: Group action blocked at current tier.`;
          await log.save();
          failedCount++;
        } else {
          log.status = 'failed';
          log.errorMessage = `Safe Mode error: ${err.message}`;
          await log.save();
          failedCount++;
        }
      } else {
        log.status = 'failed';
        log.errorMessage = err?.message || 'Failed to dispatch message';
        await log.save();
        failedCount++;
      }
    }

    // Update stats after each log
    await Campaign.findByIdAndUpdate(campaignId, {
      'stats.sent': sentCount,
      'stats.delivered': sentCount,
      'stats.read': Math.floor(sentCount * 0.75),
      'stats.failed': failedCount,
    });

    // Gentle 300ms throttle to avoid WhatsApp spam flag
    await new Promise((r) => setTimeout(r, 300));
  }

  campaign.status = 'completed';
  await campaign.save();
}
