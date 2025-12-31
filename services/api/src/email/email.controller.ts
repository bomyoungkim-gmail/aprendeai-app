import { Controller, Get, Param, Res } from "@nestjs/common";
import { Response } from "express";
import { UnsubscribeUserUseCase } from "./application/use-cases/unsubscribe-user.use-case";

@Controller("email")
export class EmailController {
  constructor(private readonly unsubscribeUseCase: UnsubscribeUserUseCase) {}

  /**
   * Unsubscribe from all emails
   */
  @Get("unsubscribe/:token")
  async unsubscribe(@Param("token") token: string, @Res() res: Response) {
    try {
      await this.unsubscribeUseCase.execute(token);

      // Return success page
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Unsubscribed - AprendeAI</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: #f3f4f6;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              text-align: center;
              max-width: 500px;
            }
            h1 { color: #1f2937; margin: 0 0 16px 0; }
            p { color: #6b7280; line-height: 1.6; }
            a { color: #3b82f6; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Unsubscribed Successfully</h1>
            <p>You have been unsubscribed from all AprendeAI email notifications.</p>
            <p>You can re-enable emails anytime in your notification settings.</p>
            <p style="margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}">← Back to AprendeAI</a>
            </p>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error - AprendeAI</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: #f3f4f6;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              text-align: center;
              max-width: 500px;
            }
            h1 { color: #dc2626; margin: 0 0 16px 0; }
            p { color: #6b7280; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Invalid Link</h1>
            <p>This unsubscribe link is invalid or has expired.</p>
            <p>Please contact support if you need assistance.</p>
          </div>
        </body>
        </html>
      `);
    }
  }
}
