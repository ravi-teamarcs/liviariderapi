import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import CONFIG from './constants/config.json'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const res = await app.listen(process.env.PORT);
  console.log(`Server is running on ${res.address().port}`);
}
bootstrap();
