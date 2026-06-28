import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@dum360/shared';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Log');
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ?? 8083;
  await app.listen(port);
  logger.log(`Log Service listening on :${port}`);
}

bootstrap();
