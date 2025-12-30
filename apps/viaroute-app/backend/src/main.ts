import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'fs';
import { Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Serve static files from React build (if exists)
  const publicPath = join(__dirname, '..', 'public');
  if (existsSync(publicPath)) {
    app.useStaticAssets(publicPath, {
      index: false,
      redirect: false,
    });
  } else {
    console.warn('Static assets directory not found, skipping static file serving');
  }

  // API routes
  app.setGlobalPrefix('api');

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Serve React app for all non-API routes (if static files exist)
  if (existsSync(publicPath)) {
    app.getHttpAdapter().get('/*path', (req: Request, res: Response) => {
      const path = (req.params as any).path || '';
      // Only serve index.html for non-API, non-health routes
      if (!req.url.startsWith('/api') && !req.url.startsWith('/health')) {
        res.sendFile(join(publicPath, 'index.html'));
      }
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();

