// import { NestFactory } from '@nestjs/core';
// import { ValidationPipe } from '@nestjs/common';
// import { AppModule } from './app.module';
// import { RedisIoAdapter } from './adapters/redis-io.adapter';
// import {
//   getCorsOrigins,
//   validateProductionEnv,
// } from './config/startup.validation';

// async function bootstrap() {
//   validateProductionEnv();

//   const app = await NestFactory.create(AppModule);

//   const corsOrigins = getCorsOrigins();

//   app.enableCors({
//     origin: corsOrigins === true ? true : corsOrigins,
//     credentials: true,
//   });

//   app.setGlobalPrefix('api');

//   app.useGlobalPipes(
//     new ValidationPipe({
//       whitelist: true,
//       transform: true,
//     }),
//   );

//   const isElectron =
//     process.env.ELECTRON_MODE === 'true' ||
//     process.versions.hasOwnProperty('electron');

//   // Redis for production server only
//   if (!isElectron) {
//     try {
//       const redisIoAdapter = new RedisIoAdapter(app);

//       await redisIoAdapter.connectToRedis();

//       app.useWebSocketAdapter(redisIoAdapter);

//       console.log('✅ Redis adapter connected');
//     } catch (error: any) {
//       console.warn(
//         '⚠️ Redis unavailable, falling back to default socket adapter',
//       );

//       console.warn(error?.message);
//     }
//   }

//   // IMPORTANT FOR RENDER
//   const port = Number(process.env.PORT) || 3000;

//   // MUST be 0.0.0.0 on Render
//   const host = '0.0.0.0';

//   await app.listen(port, host);

//   console.log(`🚀 Backend listening on http://${host}:${port}`);
// }

// bootstrap().catch((err) => {
//   console.error('❌ Failed to start backend:', err);
//   process.exit(1);
// });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';

import {
  getCorsOrigins,
  validateProductionEnv,
} from './config/startup.validation';

async function bootstrap() {
  // Validate environment variables
  validateProductionEnv();

  // Create Nest app
  const app = await NestFactory.create(AppModule);

  // CORS configuration
  const corsOrigins = getCorsOrigins();

  app.enableCors({
    origin:
      corsOrigins === true
        ? true
        : [
            'https://bingogame-1-79so.onrender.com',
            'http://localhost:8080',
            'http://localhost:5173',
          ],
    credentials: true,
  });

  // Global API prefix
  app.setGlobalPrefix('api');

  // Validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // IMPORTANT:
  // Use default websocket adapter
  // Redis disabled for Render stability
  console.log('🌐 Using default WebSocket adapter');

  // Render provides PORT automatically
  const port = Number(process.env.PORT) || 3000;

  // Render requires 0.0.0.0
  const host = '0.0.0.0';

  try {
    await app.listen(port, host);

    console.log(`🚀 Backend listening on http://${host}:${port}`);
  } catch (err: any) {
    if (err?.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use.`);
    }

    console.error('❌ Failed to start backend:', err);

    process.exit(1);
  }
}

bootstrap();
