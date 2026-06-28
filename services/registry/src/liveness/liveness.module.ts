import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '@dum360/shared';
import { LivenessService } from './liveness.service';
import { LivenessProcessor } from './liveness.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.LIVENESS_SWEEP }),
  ],
  providers: [LivenessService, LivenessProcessor],
  exports: [LivenessService],
})
export class LivenessModule {}
