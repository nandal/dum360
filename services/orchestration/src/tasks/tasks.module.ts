import { Module } from "@nestjs/common";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";
import { TaskStateMachine } from "./task-state-machine";
import { GitHubTokenService } from "../github/github-token.service";

@Module({
	controllers: [TasksController],
	providers: [TasksService, TaskStateMachine, GitHubTokenService],
	exports: [TasksService, TaskStateMachine, GitHubTokenService],
})
export class TasksModule {}
