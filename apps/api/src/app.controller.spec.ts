import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('POST /api/analyze', () => {
    it('should call appService.analyzeUrl with the provided url', async () => {
      const mockUrl = 'https://example.com';
      const mockResult = {
        url: mockUrl,
        results: {
          'title-check': { passed: true, message: 'Title exists' },
          'img-alt-check': { passed: true, message: 'All images have alt' },
          'input-label-check': { passed: true, message: 'All inputs labeled' },
        },
      };

      vi.spyOn(appService, 'analyzeUrl').mockResolvedValue(mockResult);

      const result = await appController.analyze({ url: mockUrl });

      expect(appService.analyzeUrl).toHaveBeenCalledWith(mockUrl);
      expect(result).toEqual(mockResult);
    });
  });
});
