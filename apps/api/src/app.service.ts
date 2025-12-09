import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { JSDOMParser } from './core/dom/jsdom-parser';
import { WCAGAnalyser } from './core/wcag-analyser';
import { TitleRule, ImgAltRule, InputLabelRule } from './core/rules';
import {
  UrlAnalysis,
  UrlAnalysisDocument,
  AnalysisStatus,
} from './schemas/url-analysis.schema';

@Injectable()
export class AppService {
  private readonly parser = new JSDOMParser();
  private readonly analyser = new WCAGAnalyser()
    .addRule(new TitleRule())
    .addRule(new ImgAltRule())
    .addRule(new InputLabelRule());

  constructor(
    @InjectModel(UrlAnalysis.name)
    private urlAnalysisModel: Model<UrlAnalysisDocument>,
  ) {}

  async analyzeUrl(url: string) {
    const analysis = await this.urlAnalysisModel.create({
      url,
      status: AnalysisStatus.PENDING,
    });

    try {
      analysis.status = AnalysisStatus.FETCHING;
      await analysis.save();

      const response = await axios.get(url);
      const html = response.data;

      analysis.status = AnalysisStatus.ONGOING;
      await analysis.save();

      const doc = this.parser.parseFromString(html);
      const results = this.analyser.analyse(doc);

      analysis.status = AnalysisStatus.FINISHED;
      analysis.results = results;
      await analysis.save();

      return {
        id: analysis._id,
        url: analysis.url,
        status: analysis.status,
        results: analysis.results,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
      };
    } catch (error) {
      analysis.status = AnalysisStatus.FAILED;
      analysis.errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await analysis.save();

      throw error;
    }
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
