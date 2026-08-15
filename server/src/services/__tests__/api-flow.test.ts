jest.mock('../../config/env', () => ({ env: { SESSION_DIR: './sessions' } }));
jest.mock('../../config/logger', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));
jest.mock('../../config/safemode', () => ({ getSafeModeManager: jest.fn() }));
jest.mock('../../safemode/wrapBaileysSocket', () => ({ wrapBaileysSocket: jest.fn() }));
jest.mock('../../safemode/recordKnownChatsFromStore', () => ({ recordKnownChatsFromStore: jest.fn() }));
jest.mock('@whiskeysockets/baileys', () => ({
  makeWASocket: jest.fn(), DisconnectReason: {}, useMultiFileAuthState: jest.fn(),
  fetchLatestBaileysVersion: jest.fn(), makeCacheableSignalKeyStore: jest.fn(), Browsers: { ubuntu: jest.fn() },
}));

import { runApiRequest } from '../whatsapp.service';

describe('no-code API flow', () => {
  it('uses the customer variable in the URL and renders API response fields', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ status: 'preparing' }),
    });
    (global as any).fetch = fetchMock;

    await expect(runApiRequest({
      id: 'order-status', type: 'apiRequest', inputVariable: 'orderId',
      apiUrl: 'https://orders.example.com/orders/{{orderId}}',
      content: 'Your order is going {{status}}.', apiMethod: 'GET',
    }, '11480')).resolves.toBe('Your order is going preparing.');

    expect(fetchMock).toHaveBeenCalledWith(
      new URL('https://orders.example.com/orders/11480'),
      expect.objectContaining({ method: 'GET' })
    );
  });
});
