import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));

  app.enableCors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true,
  });

  await app.listen(process.env.API_PORT ?? 3000);
}

void bootstrap();
