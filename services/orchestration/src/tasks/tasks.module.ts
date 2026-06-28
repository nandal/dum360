import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskStateMachine } from './task-state-machine';

@Module({
  controllers: [TasksController],
  providers: [TasksService, TaskStateMachine],
  exports: [TasksService, TaskStateMachine],
})
export class TasksModule {}
