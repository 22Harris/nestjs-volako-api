import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { correlationStore } from './correlation-id.context';

export const CORRELATION_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const id = (req.headers[CORRELATION_HEADER] as string | undefined) ?? randomUUID();
    res.setHeader('X-Correlation-Id', id);
    correlationStore.run(id, next);
  }
}
