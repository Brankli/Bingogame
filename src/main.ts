import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
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
  app.useGlobalPipes(new ValidationPipe());

  // Only use Redis adapter if not in Electron environment
  const isElectron = process.env.ELECTRON_MODE === 'true' || process.versions.hasOwnProperty('electron');
  
  if (!isElectron) {
    try {
      const redisIoAdapter = new RedisIoAdapter(app);
      await redisIoAdapter.connectToRedis();
      app.useWebSocketAdapter(redisIoAdapter);
      console.log('✅ Redis adapter connected');
    } catch (error) {
      console.warn('⚠️ Redis not available, using default adapter:', error.message);
    }
  } else {
    console.log('🖥️ Running in Electron mode - using default WebSocket adapter');
  }

  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '127.0.0.1';

  try {
    await app.listen(port, host);
    console.log(`🚀 Backend listening on http://${host}:${port}`);
  } catch (err: any) {
    if (err?.code === 'EADDRINUSE') {
      console.error(
        `❌ Port ${port} is already in use. Stop the other process:\n` +
          `   fuser -k ${port}/tcp\n` +
          `   Or: lsof -ti:${port} | xargs kill -9`,
      );
    }
    throw err;
  }
}
bootstrap().catch((err) => {
  console.error('❌ Failed to start backend:', err);
  process.exit(1);
});
