import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { describe, beforeEach, it, expect } from 'vitest';

describe('AppService (Integration)', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  describe('analyzeUrl', () => {
    it('should fetch HTML and return analysis results for accessible page', async () => {
      // Using a real, simple URL that's likely to be accessible
      const result = await service.analyzeUrl('https://example.com');

      expect(result.url).toBe('https://example.com');
      expect(result.results).toBeDefined();
      expect(result.results['title-check']).toBeDefined();
      expect(result.results['img-alt-check']).toBeDefined();
      expect(result.results['input-label-check']).toBeDefined();

      // example.com typically has a title
      expect(result.results['title-check'].passed).toBe(true);
    });
  });
});
