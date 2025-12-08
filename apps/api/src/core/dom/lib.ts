export interface DomDocument {
  querySelector(selector: string): DomElement | null;
  querySelectorAll(selector: string): DomElement[];
  getElementsByTagName(tag: string): DomElement[];
}

export interface DomElement {
  tagName: string;
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
  textContent: string | null;

  parent: DomElement | null;
  children: DomElement[];

  querySelector(selector: string): DomElement | null;
  querySelectorAll(selector: string): DomElement[];
}

export interface DomParser {
  parseFromString(html: string): DomDocument;
}
