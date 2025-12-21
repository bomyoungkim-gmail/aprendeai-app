import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ActionLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const start = Date.now();
    const requestId = req['id'] || '-';

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      const userId = (req as any).user?.id || 'anonymous';
      
      this.logger.log(
        `[${requestId}] ${method} ${originalUrl} ${statusCode} - ${userId} - ${duration}ms`
      );
    });

    next();
  }
}
