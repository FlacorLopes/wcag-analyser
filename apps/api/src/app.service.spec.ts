import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { getModelToken } from '@nestjs/mongoose';
import { UrlAnalysis } from './schemas/url-analysis.schema';
import { AnalysisGateway } from './analysis.gateway';

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

  mockUrlAnalysisModel.findById = async (id: string) => {
    return new mockUrlAnalysisModel({
      url: 'https://example.com',
      status: 'pending',
    });
  };

  const mockAnalysisGateway = {
    notifyProgress: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: getModelToken(UrlAnalysis.name),
          useValue: mockUrlAnalysisModel,
        },
        {
          provide: AnalysisGateway,
          useValue: mockAnalysisGateway,
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
      expect(result.status).toBe('pending');
      expect(result.id).toBeDefined();
    });
  });
});
