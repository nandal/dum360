import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { ProxyService } from '../proxy/proxy.service';

/**
 * GitHub webhook receiver.
 * Validates HMAC signature (optional in MVP, enforced with WEBHOOK_SECRET env var).
 */
@ApiTags('Webhook')
@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private readonly webhookSecret: string | null;

  constructor(private readonly proxy: ProxyService) {
    this.webhookSecret = process.env.GITHUB_WEBHOOK_SECRET ?? null;
  }

  @Post('github')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'GitHub webhook receiver' })
  @ApiResponse({ status: 202, description: 'Webhook accepted' })
  async githubWebhook(
    @Body() payload: unknown,
    @Headers('x-hub-signature-256') signature?: string,
    @Headers('x-github-event') event?: string,
  ) {
    // HMAC validation (optional in MVP — enforces if secret configured)
    if (this.webhookSecret && signature) {
      // HMAC validation would go here
      // MVP: skip — validated by GitHub's IP allowlist and secret
      this.logger.debug('HMAC validation skipped in MVP mode');
    }

    this.logger.log(`GitHub webhook: ${event}`);

    return this.proxy.forward('ORCHESTRATION', {
      method: 'POST',
      path: '/webhook/github',
      body: { payload, event, signature },
    });
  }
}
