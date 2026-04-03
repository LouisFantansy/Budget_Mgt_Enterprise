import { Module } from '@nestjs/common';
import { PurchaseController } from './purchase.controller';
import { PurchaseService } from './purchase.service';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [PrismaModule, WorkflowModule],
  controllers: [PurchaseController],
  providers: [PurchaseService],
  exports: [PurchaseService],
})
export class PurchaseModule {}
