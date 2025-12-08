import { DomDocument } from '../dom/lib';
import { RuleResult, WCAGRule } from './lib';

export class ImgAltRule implements WCAGRule {
  name = 'img-alt-check';

  analyse(doc: DomDocument): RuleResult {
    const images = doc.getElementsByTagName('img');
    const withoutAlt = images.filter(
      (img) => !img.hasAttribute('alt') || !img.getAttribute('alt')?.trim(),
    );

    return {
      passed: withoutAlt.length === 0,
      message:
        withoutAlt.length === 0
          ? 'All images have alt attributes'
          : `${withoutAlt.length} of ${images.length} images missing or have empty alt attribute`,
      details: {
        total: images.length,
        withoutAlt: withoutAlt.length,
      },
    };
  }
}
