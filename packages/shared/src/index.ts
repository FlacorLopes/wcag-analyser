export interface RuleResult<T = any> {
  passed: boolean;
  message?: string;
  details?: T;
}

export interface ImgAltRuleDetails {
  totalImages: number;
  imagesWithoutAlt: number;
  imagesWithEmptyAlt: number;
}

export interface InputLabelRuleDetails {
  totalInputs: number;
  inputsWithoutLabel: number;
}

export interface TitleRuleDetails {
  title: string | null;
}

export type RuleDetails = ImgAltRuleDetails | InputLabelRuleDetails | TitleRuleDetails;
