import { executeCampaign } from '../../services/campaign.service';
import { Campaign } from '../../models/Campaign';
import { CampaignLog } from '../../models/CampaignLog';
import { Contact } from '../../models/Contact';
import * as messageService from '../../services/message.service';
import { SafeModeError } from '../SafeModeError';

jest.mock('../../models/Campaign');
jest.mock('../../models/CampaignLog');
jest.mock('../../models/Contact');
jest.mock('../../services/message.service');
jest.mock('@whiskeysockets/baileys', () => ({
  makeWASocket: jest.fn(),
  DisconnectReason: {},
  useMultiFileAuthState: jest.fn(),
  fetchLatestBaileysVersion: jest.fn(),
  makeCacheableSignalKeyStore: jest.fn(),
  Browsers: {},
}));
jest.mock('../../config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Campaign Safe Mode Execution', () => {
  let mockCampaign: any;
  let mockLog1: any;
  let mockLog2: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCampaign = {
      _id: 'campaign-id-123',
      status: 'pending',
      instanceId: 'instance-456',
      defaultName: 'there',
      templateText: 'Hello {{name}}, join our group t.me/test',
      interactiveType: 'none',
      stats: { sent: 0, failed: 0 },
      save: jest.fn().mockResolvedValue(true),
    };

    mockLog1 = {
      _id: 'log-1',
      phone: '1234567890',
      status: 'pending',
      save: jest.fn().mockResolvedValue(true),
    };

    mockLog2 = {
      _id: 'log-2',
      phone: '0987654321',
      status: 'pending',
      save: jest.fn().mockResolvedValue(true),
    };

    (Campaign.findById as jest.Mock).mockResolvedValue(mockCampaign);
    (CampaignLog.find as jest.Mock).mockResolvedValue([mockLog1, mockLog2]);
    (Contact.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({ name: 'Alice' }),
    });
  });

  it('should successfully send messages when no safe mode errors occur', async () => {
    (messageService.sendText as jest.Mock).mockResolvedValue({ key: { id: 'msg-abc' } });

    await executeCampaign('campaign-id-123');

    expect(mockCampaign.status).toBe('completed');
    expect(mockCampaign.save).toHaveBeenCalled();
    expect(messageService.sendText).toHaveBeenCalledTimes(2);

    expect(mockLog1.status).toBe('sent');
    expect(mockLog1.messageId).toBe('msg-abc');
    expect(mockLog1.save).toHaveBeenCalled();

    expect(mockLog2.status).toBe('sent');
    expect(mockLog2.messageId).toBe('msg-abc');
    expect(mockLog2.save).toHaveBeenCalled();

    expect(Campaign.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('should handle SafeModeError F14 (Daily Cap / Sending Window) by pausing campaign', async () => {
    (messageService.sendText as jest.Mock).mockRejectedValueOnce(
      new SafeModeError('F14', 'Daily cap hit')
    );

    await executeCampaign('campaign-id-123');

    // First send failed with F14 -> it stays pending but gets error message, then campaign execution breaks.
    expect(mockLog1.status).toBe('pending');
    expect(mockLog1.errorMessage).toBe('Safe Mode: Daily cap hit');
    expect(mockLog1.save).toHaveBeenCalled();

    // Second message should not be processed at all because we broke out of loop on F14
    expect(messageService.sendText).toHaveBeenCalledTimes(1);
    expect(mockLog2.status).toBe('pending');
    expect(mockLog2.save).not.toHaveBeenCalled();

    // Verify stats updated
    expect(Campaign.findByIdAndUpdate).toHaveBeenCalledWith('campaign-id-123', expect.objectContaining({
      'stats.sent': 0,
      'stats.failed': 1,
    }));
  });

  it('should handle SafeModeError F13 (First Message Link) by failing that recipient and continuing', async () => {
    (messageService.sendText as jest.Mock)
      .mockRejectedValueOnce(new SafeModeError('F13', 'Link in first message'))
      .mockResolvedValueOnce({ key: { id: 'msg-success' } });

    await executeCampaign('campaign-id-123');

    // First message fails due to F13
    expect(mockLog1.status).toBe('failed');
    expect(mockLog1.errorMessage).toContain('Safe Mode F13: Link blocked');
    expect(mockLog1.save).toHaveBeenCalled();

    // Second message continues and succeeds
    expect(messageService.sendText).toHaveBeenCalledTimes(2);
    expect(mockLog2.status).toBe('sent');
    expect(mockLog2.messageId).toBe('msg-success');
    expect(mockLog2.save).toHaveBeenCalled();
  });

  it('should handle SafeModeError F15 (Group Actions Blocked) by failing that recipient and continuing', async () => {
    (messageService.sendText as jest.Mock)
      .mockRejectedValueOnce(new SafeModeError('F15', 'Group action blocked'))
      .mockResolvedValueOnce({ key: { id: 'msg-success' } });

    await executeCampaign('campaign-id-123');

    // First message fails due to F15
    expect(mockLog1.status).toBe('failed');
    expect(mockLog1.errorMessage).toContain('Safe Mode F15: Group action blocked');
    expect(mockLog1.save).toHaveBeenCalled();

    // Second message continues and succeeds
    expect(messageService.sendText).toHaveBeenCalledTimes(2);
    expect(mockLog2.status).toBe('sent');
    expect(mockLog2.save).toHaveBeenCalled();
  });
});
