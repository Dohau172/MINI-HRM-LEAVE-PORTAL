import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cho phép kết nối trực tiếp từ Frontend (Hỗ trợ tất cả origin cục bộ trong môi trường dev)
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Kích hoạt tiền tố API
  app.setGlobalPrefix('api');

  // Kích hoạt Validation Pipes tự động bắt lỗi các DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 5000;
  await app.listen(port, '0.0.0.0');
  console.log(`====================================================`);
  console.log(` Mini HRM Backend Server is running on: http://localhost:${port}/api`);
  console.log(` Static uploads path: http://localhost:${port}/uploads`);
  console.log(`====================================================`);
}
bootstrap();
