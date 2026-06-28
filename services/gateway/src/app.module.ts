import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ProxyModule } from './proxy/proxy.module';
import { NodeController } from './controllers/node.controller';
import { OperatorController } from './controllers/operator.controller';
import { WebhookController } from './controllers/webhook.controller';
import { AppGateway } from './websocket/app.gateway';

@Module({
  imports: [AuthModule, ProxyModule],
  controllers: [NodeController, OperatorController, WebhookController],
  providers: [AppGateway],
})
export class AppModule {}
