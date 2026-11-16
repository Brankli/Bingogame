const crypto = require('crypto');
const keytar = require('keytar');

const SERVICE = 'Bingo Desktop Sync';

async function getOrCreate(account, createValue) {
  const existing = await keytar.getPassword(SERVICE, account);
  if (existing) return existing;
  const value = createValue();
  await keytar.setPassword(SERVICE, account, value);
  return value;
}

async function loadDeviceIdentity() {
  const deviceId = await getOrCreate('device-id', () => crypto.randomUUID());
  const deviceSecret = await getOrCreate('device-secret', () =>
    crypto.randomBytes(32).toString('base64url'),
  );
  const deviceToken = await keytar.getPassword(SERVICE, 'device-token');

  return { deviceId, deviceSecret, deviceToken };
}

module.exports = { loadDeviceIdentity };
