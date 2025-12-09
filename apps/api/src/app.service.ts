import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { JSDOMParser } from './core/dom/jsdom-parser';
import { WCAGAnalyser } from './core/wcag-analyser';
import { TitleRule, ImgAltRule, InputLabelRule } from './core/rules';

@Injectable()
export class AppService {
  private readonly parser = new JSDOMParser();
  private readonly analyser = new WCAGAnalyser()
    .addRule(new TitleRule())
    .addRule(new ImgAltRule())
    .addRule(new InputLabelRule());

  async analyzeUrl(url: string) {
    const response = await axios.get(url);
    const html = response.data;

    const doc = this.parser.parseFromString(html);
    const results = this.analyser.analyse(doc);

    return {
      url,
      results,
    };
  }
}
