import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// 导入模块
import { AuthModule } from './modules/auth/auth.module';
import { DepartmentModule } from './modules/department/department.module';
import { BudgetModule } from './modules/budget/budget.module';
import { PurchaseModule } from './modules/purchase/purchase.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ReportModule } from './modules/report/report.module';
import { AuditModule } from './modules/audit/audit.module';
import { ImportExportModule } from './modules/import-export/import-export.module';
import { UserModule } from './modules/user/user.module';
import { PrismaModule } from './common/prisma/prisma.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // 公共模块
    PrismaModule,
    
    // 业务模块
    AuthModule,
    DepartmentModule,
    BudgetModule,
    PurchaseModule,
    WorkflowModule,
    NotificationModule,
    ReportModule,
    AuditModule,
    ImportExportModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
