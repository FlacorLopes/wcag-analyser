import { describe, expect, it } from 'vitest';
import { JSDOMParser } from './jsdom-parser';

describe('jsdom-parser.ts', () => {
  it('should parse HTML string correctly', () => {
    const htmlString =
      '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello World</h1></body></html>';
    const parser = new JSDOMParser();
    const document = parser.parseFromString(htmlString);
    expect(document.getElementsByTagName('title')[0].textContent).toBe('Test');
    const h1 = document.getElementsByTagName('h1')[0];
    expect(h1.textContent).toBe('Hello World');
    expect(h1.tagName).toBe('h1');
    expect(h1.parent?.tagName).toBe('body');
  });
});
