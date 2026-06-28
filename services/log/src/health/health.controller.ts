import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
	@Get()
	check() {
		return { status: "healthy", version: "0.1.0", service: "log" };
	}
}
