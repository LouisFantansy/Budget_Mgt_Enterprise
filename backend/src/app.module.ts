import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { Reflector } from '@nestjs/core';

// 配置
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { appConfig } from './config/app.config';

// 模块
import { AuthModule } from './modules/auth/auth.module';
import { BudgetModule } from './modules/budget/budget.module';
import { ExecutionModule } from './modules/execution/execution.module';
import { AdjustmentModule } from './modules/adjustment/adjustment.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { MasterModule } from './modules/master/master.module';
import { SystemModule } from './modules/system/system.module';

// 守卫
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: ['.env', '.env.development', '.env.production'],
    }),

    // 数据库模块
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // 默认开发环境开启自动同步，便于快速演进；生产环境建议关闭并使用迁移
        synchronize: !!configService.get('database.synchronize'),
        logging: configService.get('app.nodeEnv') === 'development',
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),

    // 限流模块
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60秒
        limit: 100, // 100次请求
      },
    ]),

    // 业务模块
    AuthModule,
    BudgetModule,
    ExecutionModule,
    AdjustmentModule,
    AnalysisModule,
    MasterModule,
    SystemModule,
  ],
  providers: [
    // 全局JWT认证守卫（配合 @Public() 放行公开路由）
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector) => new JwtAuthGuard(reflector),
      inject: [Reflector],
    },
    // 全局角色守卫（配合 @Roles(...) 进行授权）
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
