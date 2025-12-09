import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestFixturesController } from './test-fixtures.controller';

@Module({
  imports: [],
  controllers: [AppController, TestFixturesController],
  providers: [AppService],
})
export class AppModule {}
