/**
 * Context Interceptor
 * 
 * Phase 0: Multi-Tenancy
 * Sets request context at the start of each request
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { setRequestContext } from '../context/request-context';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by AuthGuard
    
    // Generate correlation ID if not present
    const correlationId = request.headers['x-correlation-id'] || uuidv4();
    const requestId = request.headers['x-request-id'] || uuidv4();
    
    // Set context for this request
    if (user) {
      setRequestContext({
        user: {
          id: user.id,
          institutionId: user.institutionId,
          role: user.role,
          email: user.email,
        },
        correlationId,
        requestId,
      });
      
      // Also set on request object for backwards compatibility
      request.correlationId = correlationId;
      request.requestId = requestId;
    }
    
    return next.handle();
  }
}
