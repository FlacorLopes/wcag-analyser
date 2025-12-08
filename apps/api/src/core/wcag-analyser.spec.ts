import { describe, it, expect } from 'vitest';
import { WCAGAnalyser } from './wcag-analyser';
import { JSDOMParser } from './dom/jsdom-parser';
import { TitleRule, ImgAltRule, InputLabelRule } from './rules';

describe('WCAGAnalyser', () => {
  const parser = new JSDOMParser();

  it('should return results for all added rules', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Page</title>
        </head>
        <body>
          <img src="test.jpg" alt="Test image" />
          <img src="missing.jpg" />
          <label for="name">Name:</label>
          <input type="text" id="name" />
        </body>
      </html>
    `;
    const doc = parser.parseFromString(html);

    const analyser = new WCAGAnalyser()
      .addRule(new TitleRule())
      .addRule(new ImgAltRule())
      .addRule(new InputLabelRule());

    const results = analyser.analyse(doc);

    expect(Object.keys(results)).toHaveLength(3);
    expect(results['title-check']).toBeDefined();
    expect(results['img-alt-check']).toBeDefined();
    expect(results['input-label-check']).toBeDefined();

    expect(results['title-check'].passed).toBe(true);
    expect(results['img-alt-check'].passed).toBe(false);
    expect(results['input-label-check'].passed).toBe(true);
  });

  it('should return empty object when no rules are added', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <p>Test</p>
        </body>
      </html>
    `;
    const doc = parser.parseFromString(html);

    const analyser = new WCAGAnalyser();
    const results = analyser.analyse(doc);

    expect(Object.keys(results)).toHaveLength(0);
  });

  it('should support fluent interface for adding rules', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Page</title>
        </head>
        <body></body>
      </html>
    `;
    const doc = parser.parseFromString(html);

    const analyser = new WCAGAnalyser();
    const result = analyser.addRule(new TitleRule()).addRule(new ImgAltRule());

    expect(result).toBe(analyser);

    const results = analyser.analyse(doc);
    expect(Object.keys(results)).toHaveLength(2);
  });
});
