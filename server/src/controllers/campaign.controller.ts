import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as campaignService from '../services/campaign.service';

export async function createCampaign(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const userId = req.user?.id || 'default';
    const campaign = await campaignService.createCampaign(instanceId, userId, req.body);
    res.status(201).json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
}

export async function listCampaigns(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const result = await campaignService.listCampaigns(instanceId, req.query as Record<string, unknown>);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getCampaign(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const campaign = await campaignService.getCampaignById(instanceId, req.params.id);
    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campaign not found' });
      return;
    }
    res.json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
}

export async function getCampaignLogs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const result = await campaignService.getCampaignLogs(instanceId, req.params.id, req.query as Record<string, unknown>);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function reCampaign(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    const userId = req.user?.id || 'default';
    const parentId = req.params.id;
    const campaign = await campaignService.reCampaign(instanceId, userId, parentId, req.body);
    res.status(201).json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
}

export async function deleteCampaign(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const instanceId = req.user?.id || 'default';
    await campaignService.deleteCampaign(instanceId, req.params.id);
    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (err) {
    next(err);
  }
}
