import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationGateway } from './notification.gateway';
import { EmailChannel } from './channels/email.channel';
import { PrismaModule } from 'src/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway, EmailChannel],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
