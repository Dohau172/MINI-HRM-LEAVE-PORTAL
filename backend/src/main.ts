import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cấu hình CORS toàn diện cho Frontend Render và Local Dev
  const allowedOrigins = [
    'https://mini-hrm-portal.onrender.com',
    'https://mini-hrm-leave-portal.onrender.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type,Accept,Authorization,X-Requested-With',
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
