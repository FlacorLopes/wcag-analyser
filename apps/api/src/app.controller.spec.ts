import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { getModelToken } from '@nestjs/mongoose';
import { UrlAnalysis } from './schemas/url-analysis.schema';
import { AnalysisGateway } from './analysis.gateway';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  const mockUrlAnalysisModel = {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
  };

  const mockAnalysisGateway = {
    notifyProgress: vi.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
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

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('POST /api/analyze', () => {
    it('should call appService.analyzeUrl with the provided url', async () => {
      const mockUrl = 'https://example.com';
      const mockResult = {
        id: '123',
        url: mockUrl,
        status: 'finished',
        createdAt: new Date(),
      };

      vi.spyOn(appService, 'analyzeUrl').mockResolvedValue(mockResult);

      const result = await appController.analyze({ url: mockUrl });

      expect(appService.analyzeUrl).toHaveBeenCalledWith(mockUrl);
      expect(result).toEqual(mockResult);
    });
  });

  describe('GET /api/analyses', () => {
    it('should call appService.getAnalyses with default pagination', async () => {
      const mockResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      const spy = vi
        .spyOn(appService, 'getAnalyses')
        .mockResolvedValue(mockResult);

      const result = await appController.getAnalyses();

      expect(spy).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(mockResult);
    });

    it('should call appService.getAnalyses with provided pagination', async () => {
      const mockResult = {
        items: [],
        total: 0,
        page: 2,
        limit: 20,
        totalPages: 0,
      };

      const spy = vi
        .spyOn(appService, 'getAnalyses')
        .mockResolvedValue(mockResult);

      const result = await appController.getAnalyses(2, 20);

      expect(spy).toHaveBeenCalledWith(2, 20);
      expect(result).toEqual(mockResult);
    });
  });
});
