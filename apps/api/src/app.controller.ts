import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('analyze')
  async analyze(@Body() body: { url: string }) {
    return this.appService.analyzeUrl(body.url);
  }

  @Get('analyses')
  async getAnalyses(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.appService.getAnalyses(Number(page), Number(limit));
  }
}
