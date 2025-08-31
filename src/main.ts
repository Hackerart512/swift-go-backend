import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express'; // Import this
import { join } from 'path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // Swagger imports

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS (adjust origins as needed for Flutter app and Admin panel)
  app.enableCors({
    origin: true, // Or specify origins: ['http://localhost:3000', 'http://localhost:8081']
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });


  // Global Validation Pipe (if not applied per controller)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strips properties not in DTO
    forbidNonWhitelisted: true, // Throws error if non-whitelisted properties are present
    transform: true, // Automatically transforms payloads to DTO instances
    transformOptions: {
      enableImplicitConversion: true, // Allows conversion of path/query params based on type hints
    },
  }));

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/static/', // e.g., /static/profile-photos/image.png
  });  

  // --- Swagger Configuration ---
  const config = new DocumentBuilder()
    .setTitle('Tex Ride API')
    .setDescription('The official API documentation for the Tex Ride application (Swift-go)')
    .setVersion('1.0')
    .addTag('Auth', 'User Authentication & Registration')
    .addTag('Users', 'User Profile Management')
    .addTag('Bookings', 'Ride Booking and Management')
    .addTag('Trips', 'Trip & Seat Availability')
    .addTag('Routes', 'Route & Stop Management')
    .addTag('Help', 'Help & FAQ Content')
    .addTag('Admin', 'Administrator-only endpoints')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  // --- End of Swagger Configuration ---

  const port = process.env.PORT || 3001; // Use 3001 to avoid conflict with React default
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation is available at: ${await app.getUrl()}/api-docs`);
}
bootstrap();