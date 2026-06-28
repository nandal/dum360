import { Module, Global } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtNodeStrategy } from "@dum360/shared";

/**
 * Auth module for the API Gateway.
 * Configures JWT validation using the node registration secret.
 */
@Global()
@Module({
	imports: [
		PassportModule.register({ defaultStrategy: "jwt-node" }),
		JwtModule.register({
			secret: process.env.JWT_SECRET ?? "dev-secret-change-me",
			signOptions: { expiresIn: "168h" }, // 7 days — nodes re-register on expiry
		}),
	],
	providers: [
		{
			provide: JwtNodeStrategy,
			useFactory: () =>
				new JwtNodeStrategy(process.env.JWT_SECRET ?? "dev-secret-change-me"),
		},
	],
	exports: [JwtModule, PassportModule, JwtNodeStrategy],
})
export class AuthModule {}
