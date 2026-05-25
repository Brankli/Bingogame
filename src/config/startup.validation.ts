const WEAK_SECRETS = new Set([
  'change-me-to-a-long-random-string',
  'electron-default-secret-key-change-in-production',
  'secret',
]);

export function validateProductionEnv(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const secret = process.env.SECRET_KEY?.trim();
  if (!secret || WEAK_SECRETS.has(secret) || secret.length < 32) {
    throw new Error(
      'SECRET_KEY must be set to a strong random string (32+ chars) in production.',
    );
  }

  if (!process.env.ADMIN_PASSWORD?.trim()) {
    throw new Error('ADMIN_PASSWORD is required in production.');
  }

  if (!process.env.CORS_ORIGIN?.trim()) {
    throw new Error(
      'CORS_ORIGIN is required in production (comma-separated frontend URLs).',
    );
  }
}

export function getCorsOrigins(): string[] | true {
  const corsOrigin = process.env.CORS_ORIGIN?.trim();
  if (!corsOrigin) {
    return process.env.NODE_ENV === 'production' ? [] : true;
  }
  return corsOrigin
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}
