import { Injectable } from '@nestjs/common';

interface RouteStats {
  count: number;
  errors: number;
  totalMs: number;
}

export interface RouteMetrics {
  count: number;
  errors: number;
  avgMs: number;
}

export interface MetricsSnapshot {
  uptime: number;
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  memory: { rssMB: number; heapUsedMB: number; heapTotalMB: number };
  routes: Record<string, RouteMetrics>;
}

@Injectable()
export class MetricsService {
  private readonly routes = new Map<string, RouteStats>();
  private totalRequests   = 0;
  private totalErrors     = 0;

  record(route: string, ms: number, isError: boolean): void {
    this.totalRequests++;
    if (isError) this.totalErrors++;

    const existing = this.routes.get(route) ?? { count: 0, errors: 0, totalMs: 0 };
    this.routes.set(route, {
      count:   existing.count + 1,
      errors:  existing.errors + (isError ? 1 : 0),
      totalMs: existing.totalMs + ms,
    });
  }

  getSnapshot(): MetricsSnapshot {
    const mem   = process.memoryUsage();
    const routes = this.buildRouteMetrics();
    const errorRate = this.totalRequests > 0
      ? Math.round((this.totalErrors / this.totalRequests) * 10_000) / 10_000
      : 0;

    return {
      uptime:         Math.round(process.uptime() * 10) / 10,
      totalRequests:  this.totalRequests,
      totalErrors:    this.totalErrors,
      errorRate,
      memory: {
        rssMB:       Math.round(mem.rss       / 1_048_576),
        heapUsedMB:  Math.round(mem.heapUsed  / 1_048_576),
        heapTotalMB: Math.round(mem.heapTotal / 1_048_576),
      },
      routes,
    };
  }

  reset(): void {
    this.routes.clear();
    this.totalRequests = 0;
    this.totalErrors   = 0;
  }

  private buildRouteMetrics(): Record<string, RouteMetrics> {
    const result: Record<string, RouteMetrics> = {};
    for (const [key, stats] of this.routes) {
      result[key] = {
        count:  stats.count,
        errors: stats.errors,
        avgMs:  stats.count > 0 ? Math.round(stats.totalMs / stats.count) : 0,
      };
    }
    return result;
  }
}
