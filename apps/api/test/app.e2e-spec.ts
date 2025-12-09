import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import {
  MongoDBContainer,
  StartedMongoDBContainer,
} from '@testcontainers/mongodb';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let baseUrl: string;
  let mongoContainer: StartedMongoDBContainer;

  beforeAll(async () => {
    // Start MongoDB container
    mongoContainer = await new MongoDBContainer('mongo:7').start();
    process.env.MONGO_URI = mongoContainer.getConnectionString();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0); // Listen on random available port

    const server = app.getHttpServer();
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 3000;
    baseUrl = `http://127.0.0.1:${port}`;
  }, 120000); // 2 minutes timeout for container startup

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (mongoContainer) {
      await mongoContainer.stop();
    }
  });

  it('/api/analyze (POST) - should analyze accessible HTML', async () => {
    const testUrl = `${baseUrl}/test-fixtures/accessible.html`;

    const response = await request(app.getHttpServer())
      .post('/api/analyze')
      .send({ url: testUrl })
      .expect(201);

    expect(response.body).toHaveProperty('url', testUrl);
    expect(response.body).toHaveProperty('results');
    expect(response.body.results['title-check'].passed).toBe(true);
    expect(response.body.results['img-alt-check'].passed).toBe(true);
    expect(response.body.results['input-label-check'].passed).toBe(true);
  });

  it('/api/analyze (POST) - should detect accessibility issues', async () => {
    const testUrl = `${baseUrl}/test-fixtures/not-accessible.html`;

    const response = await request(app.getHttpServer())
      .post('/api/analyze')
      .send({ url: testUrl })
      .expect(201);

    expect(response.body).toHaveProperty('url', testUrl);
    expect(response.body).toHaveProperty('results');
    expect(response.body.results['title-check'].passed).toBe(false);
    expect(response.body.results['img-alt-check'].passed).toBe(false);
    expect(response.body.results['input-label-check'].passed).toBe(false);
  });
});
