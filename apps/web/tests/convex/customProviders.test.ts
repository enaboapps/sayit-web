import { list, read, save, remove } from '@/convex/customProviders';
const bridge = 'b'.repeat(40);
let row: { _id: string; userId: string; name: string; baseUrl: string; encryptedKey: string };
let ctx: { auth: { getUserIdentity: jest.Mock }; db: { get: jest.Mock; patch: jest.Mock; insert: jest.Mock; delete: jest.Mock; query: jest.Mock } };
beforeEach(() => {
  process.env.CUSTOM_PROVIDER_BRIDGE_SECRET = bridge;
  row = { _id: 'connection', userId: 'alice', name: 'Personal', baseUrl: 'https://example.com', encryptedKey: 'encrypted' };
  ctx = { auth: { getUserIdentity: jest.fn().mockResolvedValue({ subject: 'alice' }) }, db: { get: jest.fn(async () => row), patch: jest.fn(), insert: jest.fn().mockResolvedValue('new'), delete: jest.fn(), query: jest.fn(() => ({ withIndex: jest.fn(() => ({ collect: jest.fn(async () => [row]) })) })) } };
});
test('metadata never returns ciphertext or keys', async () => {
  const result = await list._handler(ctx as never, { bridge });
  expect(result).toEqual([{ id: 'connection', name: 'Personal', baseUrl: 'https://example.com', hasKey: true }]);
});
test('browser identity alone cannot retrieve ciphertext or mutate connections', async () => {
  await expect(read._handler(ctx as never, { bridge: 'wrong', id: 'connection' as never })).rejects.toThrow('Unauthorized');
  await expect(remove._handler(ctx as never, { bridge: 'wrong', id: 'connection' as never })).rejects.toThrow('Unauthorized');
});
test('anonymous and other owners cannot read, replace or delete a connection', async () => {
  ctx.auth.getUserIdentity.mockResolvedValue(null);
  await expect(list._handler(ctx as never, { bridge })).rejects.toThrow('Unauthorized');
  ctx.auth.getUserIdentity.mockResolvedValue({ subject: 'bob' });
  await expect(read._handler(ctx as never, { bridge, id: 'connection' as never })).rejects.toThrow('not found');
  await expect(save._handler(ctx as never, { bridge, id: 'connection' as never, name: 'Hijack', baseUrl: row.baseUrl, encryptedKey: 'new' })).rejects.toThrow('not found');
  await expect(remove._handler(ctx as never, { bridge, id: 'connection' as never })).rejects.toThrow('not found');
  expect(ctx.db.patch).not.toHaveBeenCalled(); expect(ctx.db.delete).not.toHaveBeenCalled();
});
test('same account in another session reads its connection and can delete its credential', async () => {
  expect(await read._handler(ctx as never, { bridge, id: 'connection' as never })).toBe(row);
  const second = { ...ctx, auth: { getUserIdentity: async () => ({ subject: 'alice' }) } };
  expect(await read._handler(second as never, { bridge, id: 'connection' as never })).toBe(row);
  await remove._handler(second as never, { bridge, id: 'connection' as never });
  expect(ctx.db.delete).toHaveBeenCalledWith('connection');
});
