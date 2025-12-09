import { describe, it, expect, suite } from 'vitest';
import { JSDOMParser } from '../dom/jsdom-parser';
import { TitleRule } from './title-rule';
import { ImgAltRule } from './img-alt-rule';
import { InputLabelRule } from './input-label-rule';

describe('WCAG Rules', () => {
  const parser = new JSDOMParser();

  suite('TitleRule', () => {
    const rule = new TitleRule();

    it('should pass when title exists and is not empty', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>My Page</title>
          </head>
          <body></body>
        </html>
      `;
      const doc = parser.parseFromString(html);
      const result = rule.analyse(doc);

      expect(result.passed).toBe(true);
      expect(result.message).toBe('Title exists and is not empty');
      expect(result.details?.title).toBe('My Page');
    });

    it('should fail when title is missing', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head></head>
          <body></body>
        </html>
      `;
      const doc = parser.parseFromString(html);
      const result = rule.analyse(doc);

      expect(result.passed).toBe(false);
      expect(result.message).toBe('Title missing or empty');
      expect(result.details?.title).toBeNull();
    });

    it('should fail when title is empty', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>   </title>
          </head>
          <body></body>
        </html>
      `;
      const doc = parser.parseFromString(html);
      const result = rule.analyse(doc);

      expect(result.passed).toBe(false);
      expect(result.message).toBe('Title missing or empty');
      expect(result.details?.title).toBeNull();
    });
  });

  suite('ImgAltRule', () => {
    const rule = new ImgAltRule();

    it('should pass when all images have alt attributes', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <img src="image1.jpg" alt="Description 1" />
            <img src="image2.jpg" alt="Description 2" />
          </body>
        </html>
      `;
      const doc = parser.parseFromString(html);
      const result = rule.analyse(doc);

      expect(result.passed).toBe(true);
      expect(result.message).toBe('All images have alt attributes');
      expect(result.details?.totalImages).toBe(2);
      expect(result.details?.imagesWithoutAlt).toBe(0);
    });

    it('should fail when images are missing alt attribute', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <img src="image1.jpg" alt="Description" />
            <img src="image2.jpg" />
            <img src="image3.jpg" />
          </body>
        </html>
      `;
      const doc = parser.parseFromString(html);
      const result = rule.analyse(doc);

      expect(result.passed).toBe(false);
      expect(result.message).toBe(
        '2 of 3 images missing or have empty alt attribute',
      );
      expect(result.details?.totalImages).toBe(3);
      expect(result.details?.imagesWithoutAlt).toBe(2);
    });

    it('should fail when images have empty alt attribute', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <img src="image1.jpg" alt="" />
            <img src="image2.jpg" alt="  " />
          </body>
        </html>
      `;
      const doc = parser.parseFromString(html);
      const result = rule.analyse(doc);

      expect(result.passed).toBe(false);
      expect(result.message).toBe(
        '2 of 2 images missing or have empty alt attribute',
      );
      expect(result.details?.totalImages).toBe(2);
      expect(result.details?.imagesWithEmptyAlt).toBe(2);
    });

    it('should pass when there are no images', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <p>No images here</p>
          </body>
        </html>
      `;
      const doc = parser.parseFromString(html);
      const result = rule.analyse(doc);

      expect(result.passed).toBe(true);
      expect(result.details?.totalImages).toBe(0);
      expect(result.details?.imagesWithoutAlt).toBe(0);
    });
  });

  suite('InputLabelRule', () => {
    const rule = new InputLabelRule();

    it('should pass when all inputs have associated labels', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <label for="name">Name:</label>
            <input type="text" id="name" />

            <label for="email">Email:</label>
            <input type="email" id="email" />
          </body>
        </html>
      `;
      const doc = parser.parseFromString(html);
      const result = rule.analyse(doc);

      expect(result.passed).toBe(true);
      expect(result.message).toBe('All inputs have associated labels');
      expect(result.details?.totalInputs).toBe(2);
      expect(result.details?.inputsWithoutLabel).toBe(0);
    });

    it('should fail when inputs are missing id attribute', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <label for="name">Name:</label>
            <input type="text" id="name" />

            <input type="email" />
          </body>
        </html>
      `;
      const doc = parser.parseFromString(html);
      const result = rule.analyse(doc);

      expect(result.passed).toBe(false);
      expect(result.message).toBe(
        '1 of 2 inputs missing explicit label association',
      );
      expect(result.details?.totalInputs).toBe(2);
      expect(result.details?.inputsWithoutLabel).toBe(1);
    });

    it('should fail when labels do not match input ids', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <label for="name">Name:</label>
            <input type="text" id="username" />

            <label for="email">Email:</label>
            <input type="email" id="usermail" />
          </body>
        </html>
      `;
      const doc = parser.parseFromString(html);
      const result = rule.analyse(doc);

      expect(result.passed).toBe(false);
      expect(result.message).toBe(
        '2 of 2 inputs missing explicit label association',
      );
      expect(result.details?.totalInputs).toBe(2);
      expect(result.details?.inputsWithoutLabel).toBe(2);
    });

    it('should pass when there are no inputs', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <p>No inputs here</p>
          </body>
        </html>
      `;
      const doc = parser.parseFromString(html);
      const result = rule.analyse(doc);

      expect(result.passed).toBe(true);
      expect(result.details?.totalInputs).toBe(0);
      expect(result.details?.inputsWithoutLabel).toBe(0);
    });

    it('should handle mixed scenarios correctly', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <label for="name">Name:</label>
            <input type="text" id="name" />

            <input type="password" id="password" />

            <input type="submit" />
          </body>
        </html>
      `;
      const doc = parser.parseFromString(html);
      const result = rule.analyse(doc);

      expect(result.passed).toBe(false);
      expect(result.details?.totalInputs).toBe(3);
      expect(result.details?.inputsWithoutLabel).toBe(2);
    });
  });
});
