import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局前缀
  app.setGlobalPrefix('api');

  // API版本控制
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // 启用CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局响应转换拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  // 全局日志拦截器
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger API文档配置
  const config = new DocumentBuilder()
    .setTitle('预算管理系统 API')
    .setDescription('半导体研发企业预算管理系统API文档')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', '认证授权')
    .addTag('budget', '预算管理')
    .addTag('execution', '预算执行')
    .addTag('adjustment', '预算调整')
    .addTag('analysis', '分析报表')
    .addTag('master', '基础数据')
    .addTag('system', '系统管理')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🚀 预算管理系统 API 服务已启动                          ║
  ║                                                           ║
  ║   📦 版本: 1.0.0                                          ║
  ║   🌐 地址: http://localhost:${port}                        ║
  ║   📚 文档: http://localhost:${port}/api/docs               ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
