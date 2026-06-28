import { ConfigurableModuleBuilder } from '@nestjs/common';

export interface DrizzleModuleOptions {
  /** PostgreSQL connection string (e.g., postgres://user:pass@host:5432/db) */
  connectionString: string;
  /** Max connections in pool (default: 10) */
  maxConnections?: number;
  /** Connection idle timeout in seconds (default: 30) */
  idleTimeout?: number;
  /** Enable query logging (default: false) */
  logging?: boolean;
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<DrizzleModuleOptions>()
    .setClassMethodName('forRoot')
    .build();
