import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { getModelToken } from '@nestjs/mongoose';
import { UrlAnalysis, AnalysisStatus } from './schemas/url-analysis.schema';
import { AnalysisGateway } from './analysis.gateway';

describe('AppService (Integration)', () => {
  let service: AppService;
  let mockUrlAnalysisModel: any;
  let mockAnalysisGateway: any;
  let mockAnalysisInstance: any;

  beforeEach(async () => {
    mockAnalysisInstance = {
      _id: 'mock-id-123',
      url: 'https://example.com',
      status: 'pending',
      results: null,
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: vi.fn().mockResolvedValue(this),
    };

    mockUrlAnalysisModel = {
      create: vi.fn().mockResolvedValue(mockAnalysisInstance),
      findById: vi.fn().mockResolvedValue(mockAnalysisInstance),
      find: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([mockAnalysisInstance]),
      countDocuments: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(1),
      }),
    };

    mockAnalysisGateway = {
      notifyProgress: vi.fn(),
    };

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
      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: vi
          .fn()
          .mockResolvedValue(
            '<html><head><title>Test</title></head><body><img src="test.jpg" alt="test"></body></html>',
          ),
      });

      const result = await service.analyzeUrl('https://example.com');

      expect(result.url).toBe('https://example.com');
      expect(result.status).toBe('pending');
      expect(result.id).toBeDefined();

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockAnalysisGateway.notifyProgress).toHaveBeenCalledWith(
        'mock-id-123',
        expect.objectContaining({ status: AnalysisStatus.FETCHING }),
      );
      expect(mockAnalysisGateway.notifyProgress).toHaveBeenCalledWith(
        'mock-id-123',
        expect.objectContaining({ status: AnalysisStatus.ONGOING }),
      );
      expect(mockAnalysisGateway.notifyProgress).toHaveBeenCalledWith(
        'mock-id-123',
        expect.objectContaining({ status: AnalysisStatus.FINISHED }),
      );
    });

    it('should handle fetch errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      await service.analyzeUrl('https://example.com/404');

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockAnalysisGateway.notifyProgress).toHaveBeenCalledWith(
        'mock-id-123',
        expect.objectContaining({
          status: AnalysisStatus.FAILED,
          errorMessage: 'Failed to fetch URL: Not Found',
        }),
      );
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));

      await service.analyzeUrl('https://example.com/error');

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockAnalysisGateway.notifyProgress).toHaveBeenCalledWith(
        'mock-id-123',
        expect.objectContaining({
          status: AnalysisStatus.FAILED,
          errorMessage: 'Network Error',
        }),
      );
    });

    it('should not process if analysis not found', async () => {
      mockUrlAnalysisModel.findById.mockResolvedValue(null);

      await service.analyzeUrl('https://example.com');

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockAnalysisGateway.notifyProgress).not.toHaveBeenCalled();
    });
  });

  describe('getAnalyses', () => {
    it('should return paginated analyses', async () => {
      const result = await service.getAnalyses(1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);

      expect(mockUrlAnalysisModel.find).toHaveBeenCalled();
      expect(mockUrlAnalysisModel.skip).toHaveBeenCalledWith(0);
      expect(mockUrlAnalysisModel.limit).toHaveBeenCalledWith(10);
    });
  });
});
