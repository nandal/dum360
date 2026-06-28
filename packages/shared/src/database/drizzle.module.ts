import { Module, Global, Logger } from "@nestjs/common";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
	ConfigurableModuleClass,
	MODULE_OPTIONS_TOKEN,
} from "./drizzle.module-definition";
import type { DrizzleModuleOptions } from "./drizzle.module-definition";

export const DRIZZLE_DB = "DRIZZLE_DB";

/**
 * Global database module.
 * Provides a Drizzle ORM PostgresJsDatabase instance as DRIZZLE_DB.
 *
 * Usage in AppModule:
 *   DrizzleModule.forRoot({ connectionString: process.env.DATABASE_URL }),
 *
 * Usage in providers:
 *   constructor(@Inject(DRIZZLE_DB) private db: PostgresJsDatabase) {}
 */
@Global()
@Module({
	providers: [
		{
			provide: DRIZZLE_DB,
			inject: [MODULE_OPTIONS_TOKEN],
			useFactory: (options: DrizzleModuleOptions) => {
				const logger = new Logger("DrizzleModule");

				const client = postgres(options.connectionString, {
					max: options.maxConnections ?? 10,
					idle_timeout: options.idleTimeout ?? 30,
				});

				logger.log("PostgreSQL connection pool created");

				return drizzle(client, {
					logger: options.logging
						? {
								logQuery(query, params) {
									logger.debug({ query, params }, "SQL");
								},
							}
						: undefined,
				});
			},
		},
	],
	exports: [DRIZZLE_DB],
})
export class DrizzleModule extends ConfigurableModuleClass {}
