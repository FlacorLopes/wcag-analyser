import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { describe, beforeEach, it, expect } from 'vitest';
import { getModelToken } from '@nestjs/mongoose';
import { UrlAnalysis } from './schemas/url-analysis.schema';

describe('AppService (Integration)', () => {
  let service: AppService;

  const mockUrlAnalysisModel = function (dto: any) {
    this.url = dto.url;
    this.status = dto.status;
    this.results = dto.results;
    this._id = 'mock-id-123';
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.save = async () => this;
  };

  mockUrlAnalysisModel.create = async (dto: any) => {
    return new mockUrlAnalysisModel(dto);
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: getModelToken(UrlAnalysis.name),
          useValue: mockUrlAnalysisModel,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  describe('analyzeUrl', () => {
    it('should fetch HTML and return analysis results for accessible page', async () => {
      // Using a real, simple URL that's likely to be accessible
      const result = await service.analyzeUrl('https://example.com');

      expect(result.url).toBe('https://example.com');
      expect(result.status).toBe('finished');
      expect(result.results).toBeDefined();
      expect(result.results['title-check']).toBeDefined();
      expect(result.results['img-alt-check']).toBeDefined();
      expect(result.results['input-label-check']).toBeDefined();

      // example.com typically has a title
      expect(result.results['title-check'].passed).toBe(true);
    });
  });
});
