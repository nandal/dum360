import { Module } from '@nestjs/common';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';
import { IngestModule } from './ingest/ingest.module';
import { QueryModule } from './query/query.module';
import { StreamModule } from './stream/stream.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [ElasticsearchModule, IngestModule, QueryModule, StreamModule],
  controllers: [HealthController],
})
export class AppModule {}
