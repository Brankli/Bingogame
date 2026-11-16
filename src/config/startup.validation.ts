const WEAK_SECRETS = new Set([
  'change-me-to-a-long-random-string',
  'electron-default-secret-key-change-in-production',
  'secret',
]);

export function validateProductionEnv(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const isSyncServer = process.env.SYNC_SERVER_MODE === 'true';
  const secret = process.env.SECRET_KEY?.trim();
  if (!secret || WEAK_SECRETS.has(secret) || secret.length < 32) {
    throw new Error(
      'SECRET_KEY must be set to a strong random string (32+ chars) in production.',
    );
  }

  if (!isSyncServer && !process.env.ADMIN_PASSWORD?.trim()) {
    throw new Error('ADMIN_PASSWORD is required in production.');
  }

  if (!isSyncServer && !process.env.ADMIN_USERNAME?.trim()) {
    throw new Error('ADMIN_USERNAME is required in production.');
  }

  if (!isSyncServer && !process.env.CORS_ORIGIN?.trim()) {
    throw new Error(
      'CORS_ORIGIN is required in production (comma-separated frontend URLs).',
    );
  }

  if (isSyncServer) {
    if (!process.env.SYNC_SERVER_SECRET?.trim()) {
      throw new Error('SYNC_SERVER_SECRET is required in sync-server mode.');
    }
    if (!process.env.SYNC_ENROLLMENT_TOKEN?.trim()) {
      throw new Error('SYNC_ENROLLMENT_TOKEN is required in sync-server mode.');
    }
    if (!process.env.SYNC_PUBLISH_ENROLLMENT_TOKEN?.trim()) {
      throw new Error(
        'SYNC_PUBLISH_ENROLLMENT_TOKEN is required in sync-server mode.',
      );
    }
    if (
      !process.env.SYNC_DB_HOST?.trim() ||
      !process.env.SYNC_DB_USER?.trim() ||
      !process.env.SYNC_DB_NAME?.trim()
    ) {
      throw new Error(
        'SYNC_DB_HOST, SYNC_DB_USER, and SYNC_DB_NAME are required in sync-server mode.',
      );
    }
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
