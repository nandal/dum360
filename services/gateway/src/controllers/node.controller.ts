import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import {
  JwtNodeGuard,
  RegistrationTokenGuard,
  ZodValidationPipe,
  registerNodeRequestSchema,
  heartbeatRequestSchema,
  taskResultRequestSchema,
  logEntryRequestSchema,
  type RegisterNodeRequest,
  type HeartbeatRequest,
  type TaskResultRequest,
  type LogEntryRequest,
  type RegisterNodeResponse,
  type HeartbeatResponse,
  type TaskAssignPayload,
  type LogIngestResponse,
} from '@dum360/shared';
import { ProxyService } from '../proxy/proxy.service';

@ApiTags('Node')
@Controller()
export class NodeController {
  constructor(private readonly proxy: ProxyService) {}

  // ─── Registration ────────────────────────────────────────────────────
  @Post('register')
  @UseGuards(RegistrationTokenGuard)
  @ApiOperation({ summary: 'Register a new node' })
  @ApiResponse({ status: 201, description: 'Node registered' })
  @ApiResponse({ status: 401, description: 'Invalid registration token' })
  @ApiResponse({ status: 409, description: 'Node name already registered' })
  async register(
    @Body(new ZodValidationPipe(registerNodeRequestSchema)) body: RegisterNodeRequest,
  ): Promise<RegisterNodeResponse> {
    return this.proxy.forward<RegisterNodeResponse>('REGISTRY', {
      method: 'POST',
      path: '/register',
      body,
    });
  }

  // ─── Heartbeat ────────────────────────────────────────────────────────
  @Post('heartbeat')
  @UseGuards(JwtNodeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send node heartbeat' })
  @ApiResponse({ status: 200, description: 'Heartbeat acknowledged' })
  @ApiResponse({ status: 401, description: 'Invalid JWT' })
  @ApiResponse({ status: 404, description: 'Node not found' })
  async heartbeat(
    @Body(new ZodValidationPipe(heartbeatRequestSchema)) body: HeartbeatRequest,
  ): Promise<HeartbeatResponse> {
    return this.proxy.forward<HeartbeatResponse>('REGISTRY', {
      method: 'POST',
      path: '/heartbeat',
      body,
    });
  }

  // ─── Task Polling ─────────────────────────────────────────────────────
  @Get('tasks/next')
  @UseGuards(JwtNodeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Poll for next assigned task' })
  @ApiResponse({ status: 200, description: 'Task available' })
  @ApiResponse({ status: 204, description: 'No task available' })
  async pollNextTask(
    @Req() req: Request,
    @Query('wait') wait?: string,
  ): Promise<TaskAssignPayload | undefined> {
    // Identity comes from the validated node JWT (sub = nodeId), never the client.
    const nodeId = (req as Request & { user?: { sub?: string } }).user?.sub;
    return this.proxy.forward<TaskAssignPayload | undefined>('ORCHESTRATION', {
      method: 'GET',
      path: '/tasks/next',
      query: wait ? { wait } : undefined,
      headers: nodeId ? { 'x-node-id': nodeId } : undefined,
    });
  }

  // ─── Task Result ──────────────────────────────────────────────────────
  @Patch('tasks/:id/result')
  @UseGuards(JwtNodeGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report task completion or failure' })
  async reportTaskResult(
    @Param('id') taskId: string,
    @Body(new ZodValidationPipe(taskResultRequestSchema)) body: TaskResultRequest,
  ) {
    return this.proxy.forward('ORCHESTRATION', {
      method: 'PATCH',
      path: `/tasks/${taskId}/result`,
      body,
    });
  }

  // ─── Log Upload ───────────────────────────────────────────────────────
  @Post('tasks/:id/log')
  @UseGuards(JwtNodeGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a log entry for a running task' })
  async uploadLog(
    @Param('id') taskId: string,
    @Body(new ZodValidationPipe(logEntryRequestSchema)) body: LogEntryRequest,
  ): Promise<LogIngestResponse> {
    return this.proxy.forward<LogIngestResponse>('LOG', {
      method: 'POST',
      path: `/tasks/${taskId}/log`,
      body,
    });
  }
}
