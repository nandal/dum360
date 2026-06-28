import { Module } from '@nestjs/common';
import { DrizzleModule } from '@dum360/shared';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { NodesModule } from './nodes/nodes.module';
import { HeartbeatModule } from './heartbeat/heartbeat.module';
import { LivenessModule } from './liveness/liveness.module';
import { HealthController } from './health/health.controller';
import { QUEUE_NAMES } from '@dum360/shared';

@Module({
  imports: [
    // Database
    DrizzleModule.forRoot({
      connectionString: process.env.DATABASE_URL ?? 'postgres://dum360:dum360@localhost:5432/dum360',
      logging: process.env.NODE_ENV === 'development',
    }),

    // JWT (for signing node tokens)
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: '168h' },
    }),

    // BullMQ (for liveness sweep scheduled job)
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      },
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.LIVENESS_SWEEP,
    }),

    // Domain modules
    NodesModule,
    HeartbeatModule,
    LivenessModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
