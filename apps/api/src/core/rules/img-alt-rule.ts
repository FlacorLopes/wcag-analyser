import { DomDocument } from '../dom/lib';
import { RuleResult, WCAGRule } from './lib';
import { ImgAltRuleDetails } from '@wcag-analyser/shared';

export class ImgAltRule implements WCAGRule<ImgAltRuleDetails> {
  name = 'img-alt-check';

  analyse(doc: DomDocument): RuleResult<ImgAltRuleDetails> {
    const images = doc.getElementsByTagName('img');
    const withoutAlt = images.filter((img) => !img.hasAttribute('alt'));
    const emptyAlt = images.filter(
      (img) => img.hasAttribute('alt') && !img.getAttribute('alt')?.trim(),
    );

    const totalIssues = withoutAlt.length + emptyAlt.length;

    return {
      passed: totalIssues === 0,
      message:
        totalIssues === 0
          ? 'Todas as imagens possuem atributo alt'
          : `${totalIssues} de ${images.length} imagens não possuem ou têm atributo alt vazio`,
      details: {
        totalImages: images.length,
        imagesWithoutAlt: withoutAlt.length,
        imagesWithEmptyAlt: emptyAlt.length,
      },
    };
  }
}
