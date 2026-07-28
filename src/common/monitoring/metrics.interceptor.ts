import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req   = context.switchToHttp().getRequest<Request>();
    const route = this.resolveRoute(req);
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next:  () => { this.metrics.record(route, Date.now() - start, false); },
        error: () => { this.metrics.record(route, Date.now() - start, true); },
      }),
    );
  }

  private resolveRoute(req: Request): string {
    const pattern = (req.route as { path?: string } | undefined)?.path ?? req.url;
    return `${req.method} ${pattern}`;
  }
}
