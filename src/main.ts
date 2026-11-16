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
    origin: corsOrigins === true ? true : corsOrigins,
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

  // Use the default WebSocket adapter for local development.
  console.log('🌐 Using default WebSocket adapter');

  const port = Number(process.env.PORT) || 3000;

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
