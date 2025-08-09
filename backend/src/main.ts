// main.ts
import { patchNestJsSwagger, ZodValidationPipe } from 'nestjs-zod';
patchNestJsSwagger();

import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import * as YAML from 'yaml';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: '1',
  });

  app.useGlobalPipes(new ZodValidationPipe());

  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('🔥 Next Gen Nestjs API')
      .setDescription('API documentation')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    const yamlString = YAML.stringify(document);
    const outputPath = resolve(process.cwd(), 'swagger.yml');
    writeFileSync(outputPath, yamlString, { encoding: 'utf8' });

    SwaggerModule.setup('docs', app, document);
  }

  const port = 3001;
  await app.listen(port);
  console.log('✨ Application is ready ✨');
  console.log(`📡 Listening on: http://localhost:${port}/api`);
  console.log(`📚 Swagger UI:   http://localhost:${port}/docs`);
}
bootstrap();
