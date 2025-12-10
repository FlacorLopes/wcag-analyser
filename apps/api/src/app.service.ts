import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JSDOMParser } from './core/dom/jsdom-parser';
import { WCAGAnalyser } from './core/wcag-analyser';
import { TitleRule, ImgAltRule, InputLabelRule } from './core/rules';
import { AnalysisGateway } from './analysis.gateway';
import {
  UrlAnalysis,
  UrlAnalysisDocument,
  AnalysisStatus,
} from './schemas/url-analysis.schema';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly parser = new JSDOMParser();
  private readonly analyser = new WCAGAnalyser()
    .addRule(new TitleRule())
    .addRule(new ImgAltRule())
    .addRule(new InputLabelRule());

  constructor(
    @InjectModel(UrlAnalysis.name)
    private urlAnalysisModel: Model<UrlAnalysisDocument>,
    private analysisGateway: AnalysisGateway,
  ) {}

  async analyzeUrl(url: string) {
    const analysis = await this.urlAnalysisModel.create({
      url,
      status: AnalysisStatus.PENDING,
    });

    void this.processAnalysis(analysis._id.toString(), url);

    return {
      id: analysis._id.toString(),
      url: analysis.url,
      status: analysis.status,
      createdAt: analysis.createdAt,
    };
  }

  private async processAnalysis(analysisId: string, url: string) {
    const analysis = await this.urlAnalysisModel.findById(analysisId);
    if (!analysis) return;

    try {
      await this.updateStatus(analysis, AnalysisStatus.FETCHING);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }
      const html = await response.text();

      await this.updateStatus(analysis, AnalysisStatus.ONGOING);

      const doc = this.parser.parseFromString(html);
      const results = this.analyser.analyse(doc);

      analysis.status = AnalysisStatus.FINISHED;
      analysis.results = results;
      await analysis.save();

      this.analysisGateway.notifyProgress(analysisId, {
        status: AnalysisStatus.FINISHED,
        results,
      });
    } catch (error) {
      analysis.status = AnalysisStatus.FAILED;
      analysis.errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await analysis.save();

      this.analysisGateway.notifyProgress(analysisId, {
        status: AnalysisStatus.FAILED,
        errorMessage: analysis.errorMessage,
      });
    }
  }

  private async updateStatus(
    analysis: UrlAnalysisDocument,
    status: AnalysisStatus,
  ) {
    analysis.status = status;
    await analysis.save();
    this.analysisGateway.notifyProgress(analysis._id.toString(), { status });
  }

  async getAnalyses(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.urlAnalysisModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.urlAnalysisModel.countDocuments().exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
