import { Controller, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('analyze')
  async analyze(@Body() body: { url: string }) {
    return this.appService.analyzeUrl(body.url);
  }
}
