import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";

/**
 * API Key Guard for Service-to-Service Authentication
 *
 * Validates the x-api-key header against API_SERVICE_SECRET.
 * Used by workers (content_processor, news_ingestor, arxiv_ingestor)
 * to authenticate when posting data back to the API.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers["x-api-key"];

    if (!apiKey) {
      throw new UnauthorizedException("API Key is required");
    }

    const validApiKey = this.configService.get<string>("API_SERVICE_SECRET");

    if (!validApiKey) {
      throw new Error("API_SERVICE_SECRET not configured");
    }

    // TODO: Implement secret rotation mechanism for production (e.g. support multiple valid keys or key versions)
    if (apiKey !== validApiKey) {
      throw new UnauthorizedException("Invalid API Key");
    }

    return true;
  }
}
