import { Module } from '@nestjs/common';
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowController } from './workflow.controller';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WorkflowController],
  providers: [WorkflowEngineService],
  exports: [WorkflowEngineService],
})
export class WorkflowModule {}
