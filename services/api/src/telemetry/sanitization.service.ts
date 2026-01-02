import { Injectable } from "@nestjs/common";

@Injectable()
export class SanitizationService {
  private readonly PII_KEYS = [
    "email",
    "password",
    "token",
    "access_token",
    "refresh_token",
    "credit_card",
    "phone",
  ];

  scrub(data: any): any {
    if (!data) return data;
    if (typeof data === "string") return data;
    if (typeof data === "number") return data;
    if (typeof data === "boolean") return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.scrub(item));
    }

    if (typeof data === "object") {
      const scrubbed = { ...data };
      for (const key of Object.keys(scrubbed)) {
        if (this.PII_KEYS.includes(key.toLowerCase())) {
          scrubbed[key] = "[REDACTED]";
        } else if (typeof scrubbed[key] === "object") {
          scrubbed[key] = this.scrub(scrubbed[key]);
        }
      }
      return scrubbed;
    }

    return data;
  }
}
