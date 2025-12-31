import { Module } from "@nestjs/common";
import { NotificationsGateway } from "./notifications.gateway";
import { JwtModule } from "@nestjs/jwt";
import { EmailModule } from "../email/email.module";

// Use Cases
import { SendNotificationUseCase } from "./application/use-cases/send-notification.use-case";

// Adapters
import { EmailChannelAdapter } from "./infrastructure/adapters/email-channel.adapter";
import { WebSocketChannelAdapter } from "./infrastructure/adapters/websocket-channel.adapter";

@Module({
  imports: [
    EmailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "your-secret-key",
      signOptions: { expiresIn: "7d" },
    }),
  ],
  providers: [
    NotificationsGateway,
    SendNotificationUseCase,
    EmailChannelAdapter,
    WebSocketChannelAdapter,
    {
      provide: "NOTIFICATION_CHANNELS",
      useFactory: (email: EmailChannelAdapter, ws: WebSocketChannelAdapter) => [
        email,
        ws,
      ],
      inject: [EmailChannelAdapter, WebSocketChannelAdapter],
    },
  ],
  exports: [NotificationsGateway, SendNotificationUseCase],
})
export class NotificationsModule {}
