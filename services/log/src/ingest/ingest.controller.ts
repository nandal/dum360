import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { LogEntryRequest, LogIngestResponse } from '@dum360/shared';
import type { IngestService } from './ingest.service';

@ApiTags('Logs')
@Controller()
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Post('tasks/:id/log')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload a log entry for a running task (auth: JWT)' })
  async uploadLog(
    @Param('id') taskId: string,
    @Body() entry: LogEntryRequest,
  ): Promise<LogIngestResponse> {
    return this.ingestService.ingest(taskId, entry);
  }
}
