import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './adapters/redis-io.adapter';
import {
  getCorsOrigins,
  validateProductionEnv,
} from './config/startup.validation';

async function bootstrap() {
  validateProductionEnv();

  const app = await NestFactory.create(AppModule);

  const corsOrigins = getCorsOrigins();

  app.enableCors({
    origin: corsOrigins === true ? true : corsOrigins,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const isElectron =
    process.env.ELECTRON_MODE === 'true' ||
    process.versions.hasOwnProperty('electron');

  // Redis for production server only
  if (!isElectron) {
    try {
      const redisIoAdapter = new RedisIoAdapter(app);

      await redisIoAdapter.connectToRedis();

      app.useWebSocketAdapter(redisIoAdapter);

      console.log('✅ Redis adapter connected');
    } catch (error: any) {
      console.warn(
        '⚠️ Redis unavailable, falling back to default socket adapter',
      );

      console.warn(error?.message);
    }
  }

  // IMPORTANT FOR RENDER
  const port = Number(process.env.PORT) || 3000;

  // MUST be 0.0.0.0 on Render
  const host = '0.0.0.0';

  await app.listen(port, host);

  console.log(`🚀 Backend listening on http://${host}:${port}`);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start backend:', err);
  process.exit(1);
});
