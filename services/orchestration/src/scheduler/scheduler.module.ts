import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '@dum360/shared';
import { SchedulerService } from './scheduler.service';
import { SchedulerProcessor } from './scheduler.processor';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.TASK_DISPATCH }),
    TasksModule,
  ],
  providers: [SchedulerService, SchedulerProcessor],
  exports: [SchedulerService],
})
export class SchedulerModule {}
