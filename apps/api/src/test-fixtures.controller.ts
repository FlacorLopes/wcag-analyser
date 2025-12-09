import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';

@Controller('test-fixtures')
export class TestFixturesController {
  @Get('accessible.html')
  getAccessibleHtml(@Res() res: Response) {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>Test Page - Accessible</title>
        </head>
        <body>
          <h1>Test Page</h1>
          <img src="test1.jpg" alt="Test image 1" />
          <img src="test2.jpg" alt="Test image 2" />

          <form>
            <label for="username">Username:</label>
            <input type="text" id="username" />

            <label for="email">Email:</label>
            <input type="email" id="email" />
          </form>
        </body>
      </html>
    `;
    res.type('text/html').send(html.trim());
  }

  @Get('not-accessible.html')
  getNotAccessibleHtml(@Res() res: Response) {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head></head>
        <body>
          <h1>Test Page - Not Accessible</h1>
          <img src="test1.jpg" />
          <img src="test2.jpg" alt="" />

          <form>
            <input type="text" />
            <input type="email" id="email" />
          </form>
        </body>
      </html>
    `;
    res.type('text/html').send(html.trim());
  }
}
