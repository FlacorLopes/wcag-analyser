import { DomDocument } from '../dom/lib';

export interface RuleResult {
  passed: boolean;
  message?: string;
  details?: any;
}

export interface WCAGRule {
  name: string;
  analyse(doc: DomDocument): RuleResult;
}
