// adapters/jsdom-adapter.ts
import { JSDOM } from 'jsdom';
import { DomDocument, DomElement, DomParser } from './lib';

class JsdomElement implements DomElement {
  tagName: string;
  constructor(private node: Element) {
    this.tagName = this.node.tagName.toLowerCase();
  }

  getAttribute(name: string) {
    return this.node.getAttribute(name);
  }

  hasAttribute(name: string) {
    return this.node.hasAttribute(name);
  }

  get textContent() {
    return this.node.textContent;
  }

  get parent(): DomElement | null {
    return this.node.parentElement
      ? new JsdomElement(this.node.parentElement)
      : null;
  }

  get children(): DomElement[] {
    return Array.from(this.node.children).map((el) => new JsdomElement(el));
  }

  querySelector(selector: string) {
    const el = this.node.querySelector(selector);
    return el ? new JsdomElement(el) : null;
  }

  querySelectorAll(selector: string) {
    return Array.from(this.node.querySelectorAll(selector)).map(
      (el) => new JsdomElement(el),
    );
  }
}

export class JsdomDocument implements DomDocument {
  constructor(private dom: JSDOM) {}

  private get document() {
    return this.dom.window.document;
  }

  querySelector(selector: string) {
    const el = this.document.querySelector(selector);
    return el ? new JsdomElement(el) : null;
  }

  querySelectorAll(selector: string) {
    return Array.from(this.document.querySelectorAll(selector)).map(
      (el) => new JsdomElement(el),
    );
  }

  getElementsByTagName(tag: string) {
    return Array.from(this.document.getElementsByTagName(tag)).map(
      (el) => new JsdomElement(el),
    );
  }
}

export function parseWithJsdom(html: string): DomDocument {
  const dom = new JSDOM(html);
  return new JsdomDocument(dom);
}

export class JSDOMParser implements DomParser {
  parseFromString(html: string): DomDocument {
    const dom = new JSDOM(html);
    return new JsdomDocument(dom);
  }
}
