import { DomDocument } from '../dom/lib';
import { RuleResult, WCAGRule } from './lib';
import { TitleRuleDetails } from '@wcag-analyser/shared';

export class TitleRule implements WCAGRule<TitleRuleDetails> {
  name = 'title-check';

  analyse(doc: DomDocument): RuleResult<TitleRuleDetails> {
    const title = doc.querySelector('title');
    const titleText = title?.textContent?.trim();

    return {
      passed: !!titleText,
      message: titleText
        ? 'Title exists and is not empty'
        : 'Title missing or empty',
      details: { title: titleText || null },
    };
  }
}
