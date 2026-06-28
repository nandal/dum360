import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { HeartbeatRequest, HeartbeatResponse } from '@dum360/shared';
import { HeartbeatService } from './heartbeat.service';

@ApiTags('Heartbeat')
@Controller()
export class HeartbeatController {
  constructor(private readonly heartbeatService: HeartbeatService) {}

  @Post('heartbeat')
  @ApiOperation({ summary: 'Send node heartbeat (auth: JWT)' })
  async heartbeat(@Body() req: HeartbeatRequest): Promise<HeartbeatResponse> {
    return this.heartbeatService.process(req);
  }
}
