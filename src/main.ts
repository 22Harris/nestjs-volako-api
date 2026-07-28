import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { StructuredLoggerService } from './common/logging/structured-logger.service';
import cookieParser = require('cookie-parser');

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not defined. Set it in your .env file before starting the server.');
  process.exit(1);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: new StructuredLoggerService() });
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  if (process.env.NODE_ENV !== 'production') {
    const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
    const config = new DocumentBuilder()
      .setTitle('Volako API')
      .setDescription('API de comptabilité Volako — Plan Comptable Général français')
      .setVersion('1.0')
      .addCookieAuth('access_token')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
