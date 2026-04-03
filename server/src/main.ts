import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { PrismaService } from './common/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 获取配置服务
  const configService = app.get(ConfigService);

  // 启用 CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:5173'),
    credentials: true,
  });

  // 全局前缀
  app.setGlobalPrefix('api');

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 移除未装饰的属性
      forbidNonWhitelisted: true, // 抛出错误如果有未装饰的属性
      transform: true, // 自动转换 payload 类型
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter());

  // 全局拦截器
  app.useGlobalInterceptors(new TransformInterceptor());
  
  // 审计日志拦截器（需要 PrismaService）
  const prismaService = app.get(PrismaService);
  app.useGlobalInterceptors(new AuditLogInterceptor(prismaService));

  // Swagger API 文档
  const config = new DocumentBuilder()
    .setTitle('企业预算管理系统 API')
    .setDescription('企业级预算管理系统的后端 API 接口文档')
    .setVersion('2.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 启动服务器
  const port = configService.get('PORT', 3000);
  await app.listen(port);
  
  console.log(`应用程序运行在端口：${port}`);
  console.log(`API 文档地址：http://localhost:${port}/api/docs`);
}

bootstrap();
