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
        ? 'Título existe e não está vazio'
        : 'Título ausente ou vazio',
      details: { title: titleText || null },
    };
  }
}
