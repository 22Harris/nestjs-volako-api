import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req         = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const start       = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res    = context.switchToHttp().getResponse<Response>();
          const ms     = Date.now() - start;
          this.logger.log(`${method} ${url} ${res.statusCode} +${ms}ms`);
        },
        error: (err: unknown) => {
          const ms      = Date.now() - start;
          const message = err instanceof Error ? err.message : String(err);
          this.logger.error(`${method} ${url} ERROR +${ms}ms — ${message}`);
        },
      }),
    );
  }
}
