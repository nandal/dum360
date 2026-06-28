import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';

@ApiTags('Webhook')
@Controller()
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('webhook/github')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'GitHub webhook receiver' })
  async githubWebhook(
    @Body() body: { payload: Record<string, unknown>; event: string },
  ) {
    return this.webhookService.handleGitHubWebhook(body.event, body.payload);
  }
}
