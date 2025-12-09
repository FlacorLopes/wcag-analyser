import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalysisGateway } from './analysis.gateway';
import { TestFixturesController } from './test-fixtures.controller';
import { UrlAnalysis, UrlAnalysisSchema } from './schemas/url-analysis.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URI!),
    MongooseModule.forFeature([
      { name: UrlAnalysis.name, schema: UrlAnalysisSchema },
    ]),
  ],
  controllers: [AppController, TestFixturesController],
  providers: [AppService, AnalysisGateway],
})
export class AppModule {}
