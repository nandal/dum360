import { Module } from "@nestjs/common";
import { StreamGateway } from "./stream.gateway";
import { StreamService } from "./stream.service";

@Module({
	providers: [StreamGateway, StreamService],
})
export class StreamModule {}
