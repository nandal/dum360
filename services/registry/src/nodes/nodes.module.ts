import { Module } from "@nestjs/common";
import { NodesController } from "./nodes.controller";
import { NodesService } from "./nodes.service";
import { AttestationModule } from "../attestation/attestation.module";

@Module({
	imports: [AttestationModule],
	controllers: [NodesController],
	providers: [NodesService],
	exports: [NodesService],
})
export class NodesModule {}
