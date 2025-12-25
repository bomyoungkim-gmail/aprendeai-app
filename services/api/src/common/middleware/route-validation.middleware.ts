import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

/**
 * Route Validation Middleware
 * Validates incoming requests against centralized route definitions
 */
@Injectable()
export class RouteValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Validate route parameters
    const { path, method } = req;

    // Extract ID parameters from path
    const idPattern = /\/([a-f0-9-]{36}|[a-zA-Z0-9_-]+)/g;
    const ids = path.match(idPattern);

    // Validate UUID format for ID parameters (if applicable)
    if (ids) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      ids.forEach((id) => {
        const cleanId = id.substring(1); // Remove leading slash

        // Skip validation for non-UUID params (like 'policy', 'start', etc.)
        if (cleanId.includes("_") || cleanId.length < 8) {
          return;
        }

        // Skip common route segments
        const skipWords = [
          "families",
          "classrooms",
          "co-sessions",
          "teachback",
          "policy",
          "dashboard",
          "reports",
          "enrollments",
          "interventions",
          "plans",
        ];
        if (skipWords.includes(cleanId)) {
          return;
        }

        // Validate UUID format for actual IDs
        if (
          cleanId.startsWith("fam_") ||
          cleanId.startsWith("class_") ||
          cleanId.startsWith("user_")
        ) {
          // Custom ID format - allow
          return;
        }

        // Check if it's a potential UUID
        if (cleanId.length === 36 && !uuidRegex.test(cleanId)) {
          throw new BadRequestException(`Invalid ID format: ${cleanId}`);
        }
      });
    }

    next();
  }
}
