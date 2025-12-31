"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailController = void 0;
const common_1 = require("@nestjs/common");
const unsubscribe_user_use_case_1 = require("./application/use-cases/unsubscribe-user.use-case");
let EmailController = class EmailController {
    constructor(unsubscribeUseCase) {
        this.unsubscribeUseCase = unsubscribeUseCase;
    }
    async unsubscribe(token, res) {
        try {
            await this.unsubscribeUseCase.execute(token);
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
        }
        catch (error) {
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
};
exports.EmailController = EmailController;
__decorate([
    (0, common_1.Get)("unsubscribe/:token"),
    __param(0, (0, common_1.Param)("token")),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "unsubscribe", null);
exports.EmailController = EmailController = __decorate([
    (0, common_1.Controller)("email"),
    __metadata("design:paramtypes", [unsubscribe_user_use_case_1.UnsubscribeUserUseCase])
], EmailController);
//# sourceMappingURL=email.controller.js.map