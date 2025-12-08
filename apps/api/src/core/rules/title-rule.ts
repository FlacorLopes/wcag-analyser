import { DomDocument } from '../dom/lib';
import { RuleResult, WCAGRule } from './lib';

export class TitleRule implements WCAGRule {
  name = 'title-check';

  analyse(doc: DomDocument): RuleResult {
    const title = doc.querySelector('title');
    const titleText = title?.textContent?.trim();

    return {
      passed: !!titleText,
      message: titleText
        ? 'Title exists and is not empty'
        : 'Title missing or empty',
      details: { titleText: titleText || null },
    };
  }
}
