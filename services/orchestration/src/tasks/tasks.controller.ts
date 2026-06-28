import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import type { CreateTaskRequest, TaskResultRequest, TaskListQuery } from '@dum360/shared';
import type { TasksService } from './tasks.service';

@ApiTags('Tasks')
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new task' })
  async createTask(
    @Body() req: CreateTaskRequest,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.tasksService.create(req);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'List tasks' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'executor', required: false })
  @ApiQuery({ name: 'nodeId', required: false })
  @ApiQuery({ name: 'repository', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async listTasks(
    @Query('status') status?: string,
    @Query('executor') executor?: string,
    @Query('nodeId') nodeId?: string,
    @Query('repository') repository?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const query: TaskListQuery = {};
    if (status) query.status = status as TaskListQuery['status'];
    if (executor) query.executor = executor as TaskListQuery['executor'];
    if (nodeId) query.nodeId = nodeId;
    if (repository) query.repository = repository;
    if (limit) query.limit = parseInt(limit, 10);
    if (offset) query.offset = parseInt(offset, 10);
    return this.tasksService.listTasks(query);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get full task detail' })
  async getTask(@Param('id') taskId: string) {
    return this.tasksService.getTask(taskId);
  }

  @Patch('tasks/:id/result')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Report task completion or failure' })
  async reportResult(
    @Param('id') taskId: string,
    @Body() req: TaskResultRequest,
  ) {
    return this.tasksService.transitionTask(
      taskId,
      req.status,
      req.error,
      req.artifacts,
      req.error,
    );
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a queued or running task' })
  async cancelTask(@Param('id') taskId: string) {
    return this.tasksService.transitionTask(
      taskId,
      'cancelled',
      'Cancelled by operator',
    );
  }

  @Get('tasks/next')
  @ApiOperation({ summary: 'Poll for next assigned task (node-facing)' })
  async pollNextTask(@Query('nodeId') nodeId?: string) {
    if (!nodeId) {
      // No node context — return empty (scheduler assigns, not poll)
      return null;
    }
    // Find task assigned to this node that is running
    return null; // Simplified: actual assignment is push-based via scheduler
  }
}
