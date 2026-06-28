import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import {
  ApiKeyGuard,
  ZodValidationPipe,
  createTaskRequestSchema,
  type CreateTaskRequest,
} from '@dum360/shared';
import { ProxyService } from '../proxy/proxy.service';

@ApiTags('Operator')
@Controller()
export class OperatorController {
  constructor(private readonly proxy: ProxyService) {}

  // ─── Health ───────────────────────────────────────────────────────────
  @Get('health')
  @ApiOperation({ summary: 'Server health check (public)' })
  @ApiResponse({ status: 200, description: 'Healthy' })
  health() {
    return { status: 'healthy', version: '0.1.0' };
  }

  // ─── Nodes ────────────────────────────────────────────────────────────
  @Get('nodes')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'List all registered nodes' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'executor', required: false })
  async listNodes(
    @Query('status') status?: string,
    @Query('executor') executor?: string,
  ) {
    const query: Record<string, string> = {};
    if (status) query.status = status;
    if (executor) query.executor = executor;

    return this.proxy.forward('REGISTRY', {
      method: 'GET',
      path: '/nodes',
      query,
    });
  }

  @Get('nodes/:id')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Get detailed node information' })
  async getNode(@Param('id') nodeId: string) {
    return this.proxy.forward('REGISTRY', {
      method: 'GET',
      path: `/nodes/${nodeId}`,
    });
  }

  // ─── Tasks ────────────────────────────────────────────────────────────
  @Post('tasks')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new task (manual submission)' })
  async createTask(
    @Body(new ZodValidationPipe(createTaskRequestSchema)) body: CreateTaskRequest,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.proxy.forward('ORCHESTRATION', {
      method: 'POST',
      path: '/tasks',
      body,
      headers: idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : undefined,
    });
  }

  @Get('tasks')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'List tasks with optional filters' })
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
    const query: Record<string, string> = {};
    if (status) query.status = status;
    if (executor) query.executor = executor;
    if (nodeId) query.nodeId = nodeId;
    if (repository) query.repository = repository;
    if (limit) query.limit = limit;
    if (offset) query.offset = offset;

    return this.proxy.forward('ORCHESTRATION', {
      method: 'GET',
      path: '/tasks',
      query,
    });
  }

  @Get('tasks/:id')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Get full task detail with state transitions' })
  async getTask(@Param('id') taskId: string) {
    return this.proxy.forward('ORCHESTRATION', {
      method: 'GET',
      path: `/tasks/${taskId}`,
    });
  }

  @Delete('tasks/:id')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a queued or running task' })
  async cancelTask(@Param('id') taskId: string) {
    return this.proxy.forward('ORCHESTRATION', {
      method: 'DELETE',
      path: `/tasks/${taskId}`,
    });
  }

  // ─── Logs ─────────────────────────────────────────────────────────────
  @Get('tasks/:id/logs')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Retrieve log entries for a task' })
  async getTaskLogs(
    @Param('id') taskId: string,
    @Query('tail') tail?: string,
    @Query('level') level?: string,
  ) {
    const query: Record<string, string> = {};
    if (tail) query.tail = tail;
    if (level) query.level = level;

    return this.proxy.forward('LOG', {
      method: 'GET',
      path: `/tasks/${taskId}/logs`,
      query,
    });
  }
}
