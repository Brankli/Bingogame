import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { RedisIoAdapter } from './adapters/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
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

  await app.listen(3000, '127.0.0.1');
  console.log('🚀 Backend listening on http://127.0.0.1:3000');
}
bootstrap().catch(err => {
  console.error('❌ Failed to start backend:', err);
  process.exit(1);
});
