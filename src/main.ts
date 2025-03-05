import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import CONFIG from './common/constants/config.json'
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // const app = await NestFactory.create(AppModule);
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.enableCors();
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(new ValidationPipe());
  const config = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('API documentation for my application')
    .setVersion('1.0')
    .addBearerAuth() 
    .addApiKey(
      { type: 'apiKey', in: 'header', name: 'x-api-key' },
      'API_KEY',  
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const swaggerApi = CONFIG.ROUTE + '/api';
  SwaggerModule.setup(swaggerApi, app, document);

  await app.listen(process.env.PORT);
  console.log(`Server is running on ${process.env.PORT}`);
}
bootstrap();
