import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DB } from '@dum360/shared';
import { eq, and } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';
import type { TasksService } from '../tasks/tasks.service';

const DUM360_TRIGGER = '@dum360';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @Inject(DRIZZLE_DB) private db: PostgresJsDatabase<typeof schema>,
    private readonly tasksService: TasksService,
  ) {}

  async handleGitHubWebhook(
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<{ accepted: boolean; tasksCreated: number; tasks?: string[] }> {
    // Parse GitHub event
    const action = (payload.action as string) ?? 'unknown';
    const repository = (payload.repository as { full_name?: string })?.full_name ?? 'unknown';
    const sender = (payload.sender as { login?: string })?.login ?? 'unknown';
    const issueNumber =
      (payload.issue as { number?: number })?.number ??
      (payload.pull_request as { number?: number })?.number ??
      null;

    // Extract @dum360 command from comment/issue body
    const body =
      (payload.comment as { body?: string })?.body ??
      (payload.issue as { body?: string })?.body ??
      '';
    const command = this.parseCommand(body);

    // Record webhook event
    await this.db.insert(schema.webhookEvents).values({
      eventType: eventType as typeof schema.webhookEventTypeEnum.enumValues[number],
      action,
      repository,
      issueNumber,
      sender,
      command,
      payload: payload as Record<string, unknown>,
      processed: !!command,
    });

    if (!command) {
      return { accepted: true, tasksCreated: 0 };
    }

    // Create task from command
    const tasks: string[] = [];
    const task = await this.tasksService.create({
      executor: 'github',
      repository,
      branch: 'main',
      issue: issueNumber
        ? {
            number: issueNumber,
            title: (payload.issue as { title?: string })?.title ?? 'Unknown issue',
            body: body,
          }
        : undefined,
      instructions: command,
      aiProvider: 'claude',
      requirements: [
        { capabilityName: 'git' },
        { capabilityName: 'claude' },
        { capabilityName: 'gh' },
      ],
    });
    tasks.push(task.id);

    this.logger.log(`Webhook → ${tasks.length} task(s) created`);

    return { accepted: true, tasksCreated: tasks.length, tasks };
  }

  /** Parse @dum360 command from GitHub comment/issue body. */
  private parseCommand(body: string): string | null {
    if (!body) return null;

    const idx = body.indexOf(DUM360_TRIGGER);
    if (idx === -1) return null;

    // Extract everything after @dum360 on the same line
    const afterTrigger = body.slice(idx + DUM360_TRIGGER.length);
    const lineEnd = afterTrigger.indexOf('\n');
    const command = (lineEnd === -1 ? afterTrigger : afterTrigger.slice(0, lineEnd)).trim();

    return command || null;
  }
}
