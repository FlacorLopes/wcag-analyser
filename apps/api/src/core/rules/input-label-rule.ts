import { DomDocument } from '../dom/lib';
import { RuleResult, WCAGRule } from './lib';

export class InputLabelRule implements WCAGRule {
  name = 'input-label-check';

  analyse(doc: DomDocument): RuleResult {
    const inputs = doc.getElementsByTagName('input');
    const withoutLabel = inputs.filter((input) => {
      const id = input.getAttribute('id');
      if (!id) return true;

      const labels = doc.getElementsByTagName('label');
      const hasLabel = labels.some((label) => label.getAttribute('for') === id);

      return !hasLabel;
    });

    return {
      passed: withoutLabel.length === 0,
      message:
        withoutLabel.length === 0
          ? 'All inputs have associated labels'
          : `${withoutLabel.length} of ${inputs.length} inputs missing explicit label association`,
      details: {
        total: inputs.length,
        withoutLabel: withoutLabel.length,
      },
    };
  }
}
