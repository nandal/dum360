import { Controller, Get, Post, Param, Query, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { RegisterNodeRequest, RegisterNodeResponse } from '@dum360/shared';
import type { NodesService } from './nodes.service';

@ApiTags('Nodes')
@Controller()
export class NodesController {
  private readonly logger = new Logger(NodesController.name);

  constructor(private readonly nodesService: NodesService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new node (auth: registration token)' })
  async register(@Body() req: RegisterNodeRequest): Promise<RegisterNodeResponse> {
    return this.nodesService.register(req);
  }

  @Get('nodes')
  @ApiOperation({ summary: 'List all registered nodes' })
  async listNodes(@Query('status') status?: string) {
    return this.nodesService.listNodes({ status });
  }

  @Get('nodes/:id')
  @ApiOperation({ summary: 'Get detailed node information' })
  async getNode(@Param('id') nodeId: string) {
    return this.nodesService.getNode(nodeId);
  }
}
