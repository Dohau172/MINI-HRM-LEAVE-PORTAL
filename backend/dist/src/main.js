"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
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
            }
            else {
                callback(null, true);
            }
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type,Accept,Authorization,X-Requested-With',
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const port = process.env.PORT || 5000;
    await app.listen(port, '0.0.0.0');
    console.log(`====================================================`);
    console.log(` Mini HRM Backend Server is running on: http://localhost:${port}/api`);
    console.log(` Static uploads path: http://localhost:${port}/uploads`);
    console.log(`====================================================`);
}
bootstrap();
//# sourceMappingURL=main.js.map