import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { QueryService } from './query.service';

@ApiTags('Logs')
@Controller()
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Get('tasks/:id/logs')
  @ApiOperation({ summary: 'Retrieve log entries for a task' })
  @ApiQuery({ name: 'tail', required: false })
  @ApiQuery({ name: 'level', required: false })
  async getTaskLogs(
    @Param('id') taskId: string,
    @Query('tail') tail?: string,
    @Query('level') level?: string,
  ) {
    return this.queryService.getTaskLogs(taskId, {
      tail: tail ? parseInt(tail, 10) : undefined,
      level,
    });
  }
}
