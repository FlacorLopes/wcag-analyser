import { DomDocument } from '../dom/lib';
import { RuleResult, WCAGRule } from './lib';
import { InputLabelRuleDetails } from '@wcag-analyser/shared';

export class InputLabelRule implements WCAGRule<InputLabelRuleDetails> {
  name = 'input-label-check';

  analyse(doc: DomDocument): RuleResult<InputLabelRuleDetails> {
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
          ? 'Todos os inputs possuem labels associados'
          : `${withoutLabel.length} de ${inputs.length} inputs não possuem associação explícita de label`,
      details: {
        totalInputs: inputs.length,
        inputsWithoutLabel: withoutLabel.length,
      },
    };
  }
}
