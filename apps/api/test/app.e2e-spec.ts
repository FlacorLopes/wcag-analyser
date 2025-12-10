import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import {
  MongoDBContainer,
  StartedMongoDBContainer,
} from '@testcontainers/mongodb';
import { AddressInfo } from 'node:net';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UrlAnalysis } from '../src/schemas/url-analysis.schema';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let baseUrl: string;
  let mongoContainer: StartedMongoDBContainer;
  let urlAnalysisModel: Model<UrlAnalysis>;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    mongoContainer = await new MongoDBContainer('mongo:7').start();

    const rawUri = mongoContainer.getConnectionString();
    const uri = `${rawUri}${rawUri.includes('?') ? '&' : '?'}directConnection=true`;

    process.env.MONGO_URI = uri;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useWebSocketAdapter(new WsAdapter(app));
    urlAnalysisModel = moduleFixture.get<Model<UrlAnalysis>>(
      getModelToken(UrlAnalysis.name),
    );
    await app.init();
    await app.listen(0); // Listen on random available port

    const server = app.getHttpServer();
    const address = server.address() as AddressInfo;
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

    let analysis;
    for (let i = 0; i < 60; i++) {
      const listResponse = await request(app.getHttpServer())
        .get('/api/analyses')
        .expect(200);

      analysis = listResponse.body.items.find(
        (item: any) => item._id === response.body.id,
      );
      if (
        analysis &&
        (analysis.status === 'finished' || analysis.status === 'failed')
      ) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (analysis?.status === 'failed') {
      console.error('Analysis failed:', analysis.errorMessage);
    }

    expect(analysis).toBeDefined();
    expect(analysis.status).toBe('finished');
    expect(analysis).toHaveProperty('results');
    expect(analysis.results['title-check'].passed).toBe(true);
    expect(analysis.results['img-alt-check'].passed).toBe(true);
    expect(analysis.results['input-label-check'].passed).toBe(true);
  });

  it('/api/analyze (POST) - should detect accessibility issues', async () => {
    const testUrl = `${baseUrl}/test-fixtures/not-accessible.html`;

    const response = await request(app.getHttpServer())
      .post('/api/analyze')
      .send({ url: testUrl })
      .expect(201);

    expect(response.body).toHaveProperty('url', testUrl);

    let analysis;
    for (let i = 0; i < 60; i++) {
      const listResponse = await request(app.getHttpServer())
        .get('/api/analyses')
        .expect(200);

      analysis = listResponse.body.items.find(
        (item: any) => item._id === response.body.id,
      );
      if (
        analysis &&
        (analysis.status === 'finished' || analysis.status === 'failed')
      ) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (analysis?.status === 'failed') {
      console.error('Analysis failed:', analysis.errorMessage);
    }

    expect(analysis).toBeDefined();
    expect(analysis.status).toBe('finished');
    expect(analysis).toHaveProperty('results');
    expect(analysis.results['title-check'].passed).toBe(false);
    expect(analysis.results['img-alt-check'].passed).toBe(false);
    expect(analysis.results['input-label-check'].passed).toBe(false);
  });

  it('/api/analyses (GET) - should return paginated analyses', async () => {
    const urls = [
      `${baseUrl}/test-fixtures/accessible.html`,
      `${baseUrl}/test-fixtures/not-accessible.html`,
      `${baseUrl}/test-fixtures/not-accessible.html`,
    ];

    for (const url of urls) {
      await request(app.getHttpServer()).post('/api/analyze').send({ url });
    }

    const response = await request(app.getHttpServer())
      .get('/api/analyses')
      .query({ page: 1, limit: 2 })
      .expect(200);

    expect(response.body).toHaveProperty('items');
    expect(response.body.items).toHaveLength(2);
    expect(response.body).toHaveProperty('total');
    expect(response.body.total).toBeGreaterThanOrEqual(3);
    expect(response.body).toHaveProperty('page', 1);
    expect(response.body).toHaveProperty('limit', 2);
    expect(response.body).toHaveProperty('totalPages');

    for (let i = 0; i < 60; i++) {
      const pendingCount = await urlAnalysisModel.countDocuments({
        status: { $in: ['pending', 'fetching', 'ongoing'] },
      });
      if (pendingCount === 0) break;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  });
});
