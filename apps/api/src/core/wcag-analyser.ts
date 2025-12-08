import { DomDocument } from './dom/lib';
import { WCAGRule, RuleResult } from './rules/lib';

export class WCAGAnalyser {
  private rules: WCAGRule[] = [];

  addRule(rule: WCAGRule): this {
    this.rules.push(rule);
    return this;
  }

  analyse(doc: DomDocument): Record<string, RuleResult> {
    return this.rules.reduce(
      (results, rule) => {
        results[rule.name] = rule.analyse(doc);
        return results;
      },
      {} as Record<string, RuleResult>,
    );
  }
}
