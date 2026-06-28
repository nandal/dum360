import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@dum360/shared';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Orchestration');
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ?? 8082;
  await app.listen(port);
  logger.log(`Orchestration Service listening on :${port}`);
}

bootstrap();
