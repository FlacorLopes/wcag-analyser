import { DomDocument } from '../dom/lib';
import { RuleResult } from '@wcag-analyser/shared';

export type { RuleResult };

export interface WCAGRule<T = any> {
  name: string;
  analyse(doc: DomDocument): RuleResult<T>;
}
