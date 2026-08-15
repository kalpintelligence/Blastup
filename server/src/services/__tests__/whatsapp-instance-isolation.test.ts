jest.mock('../../models/WhatsAppInstance', () => ({
  WhatsAppInstance: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../../config/env', () => ({ env: { SESSION_DIR: './sessions' } }));
jest.mock('../../config/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('../../config/safemode', () => ({ getSafeModeManager: jest.fn() }));
jest.mock('../../safemode/wrapBaileysSocket', () => ({ wrapBaileysSocket: jest.fn() }));
jest.mock('../../safemode/recordKnownChatsFromStore', () => ({ recordKnownChatsFromStore: jest.fn() }));
jest.mock('@whiskeysockets/baileys', () => ({
  makeWASocket: jest.fn(),
  DisconnectReason: {},
  useMultiFileAuthState: jest.fn(),
  fetchLatestBaileysVersion: jest.fn(),
  makeCacheableSignalKeyStore: jest.fn(),
  Browsers: { ubuntu: jest.fn() },
}));

import { WhatsAppInstance } from '../../models/WhatsAppInstance';
import { getInstanceStatus, getQRCode } from '../whatsapp.service';

describe('WhatsApp instance isolation', () => {
  it('reads connection status only for the authenticated account instance', async () => {
    const ownInstance = { instanceId: 'account-a', status: 'disconnected' };
    const select = jest.fn().mockResolvedValue(ownInstance);
    (WhatsAppInstance.findOne as jest.Mock).mockReturnValue({ select });

    await expect(getInstanceStatus('account-a')).resolves.toBe(ownInstance);

    expect(WhatsAppInstance.findOne).toHaveBeenCalledTimes(1);
    expect(WhatsAppInstance.findOne).toHaveBeenCalledWith({ instanceId: 'account-a' });
    expect(select).toHaveBeenCalledWith('-qrCode');
  });

  it('never falls back to another account when loading a QR code', async () => {
    const ownInstance = { instanceId: 'account-a', status: 'disconnected', qrCode: null };
    const select = jest.fn().mockResolvedValue(ownInstance);
    (WhatsAppInstance.findOne as jest.Mock).mockReturnValue({ select });

    await expect(getQRCode('account-a')).resolves.toBeNull();

    expect(WhatsAppInstance.findOne).toHaveBeenCalledTimes(1);
    expect(WhatsAppInstance.findOne).toHaveBeenCalledWith({ instanceId: 'account-a' });
    expect(select).toHaveBeenCalledWith('+qrCode');
  });
});
