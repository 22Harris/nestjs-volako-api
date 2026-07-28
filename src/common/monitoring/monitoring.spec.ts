import { UnauthorizedException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Request } from 'express';
import { MetricsService } from './metrics.service';
import { HealthService } from './health.service';
import { MetricsInterceptor } from './metrics.interceptor';
import { MonitoringController } from './monitoring.controller';

// ── MetricsService ────────────────────────────────────────────────────────────

describe('MetricsService', () => {
  let svc: MetricsService;

  beforeEach(() => { svc = new MetricsService(); });

  it('starts with zero totals', () => {
    const snap = svc.getSnapshot();
    expect(snap.totalRequests).toBe(0);
    expect(snap.totalErrors).toBe(0);
    expect(snap.errorRate).toBe(0);
  });

  it('records a successful request', () => {
    svc.record('GET /health', 12, false);
    const snap = svc.getSnapshot();
    expect(snap.totalRequests).toBe(1);
    expect(snap.totalErrors).toBe(0);
  });

  it('records an error request', () => {
    svc.record('POST /accounts', 5, true);
    const snap = svc.getSnapshot();
    expect(snap.totalErrors).toBe(1);
    expect(snap.errorRate).toBe(1);
  });

  it('computes error rate correctly with mixed requests', () => {
    svc.record('GET /a', 10, false);
    svc.record('GET /a', 20, false);
    svc.record('GET /a', 5,  true);
    const snap = svc.getSnapshot();
    expect(snap.errorRate).toBeCloseTo(1 / 3, 3);
  });

  it('tracks per-route counts', () => {
    svc.record('GET /accounts', 8, false);
    svc.record('GET /accounts', 12, false);
    svc.record('POST /accounts', 20, false);
    const snap = svc.getSnapshot();
    expect(snap.routes['GET /accounts']?.count).toBe(2);
    expect(snap.routes['POST /accounts']?.count).toBe(1);
  });

  it('computes avgMs per route', () => {
    svc.record('GET /test', 10, false);
    svc.record('GET /test', 30, false);
    const snap = svc.getSnapshot();
    expect(snap.routes['GET /test']?.avgMs).toBe(20);
  });

  it('tracks route errors separately from totals', () => {
    svc.record('DELETE /item', 5, true);
    svc.record('DELETE /item', 6, false);
    const snap = svc.getSnapshot();
    expect(snap.routes['DELETE /item']?.errors).toBe(1);
    expect(snap.routes['DELETE /item']?.count).toBe(2);
  });

  it('reset() clears all stats', () => {
    svc.record('GET /a', 5, false);
    svc.reset();
    const snap = svc.getSnapshot();
    expect(snap.totalRequests).toBe(0);
    expect(Object.keys(snap.routes)).toHaveLength(0);
  });

  it('snapshot includes uptime and memory fields', () => {
    const snap = svc.getSnapshot();
    expect(snap.uptime).toBeGreaterThanOrEqual(0);
    expect(snap.memory.rssMB).toBeGreaterThan(0);
    expect(snap.memory.heapUsedMB).toBeGreaterThan(0);
  });
});

// ── HealthService ─────────────────────────────────────────────────────────────

describe('HealthService', () => {
  it('returns ok when database responds', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) } as any;
    const svc    = new HealthService(prisma);
    const status = await svc.check();
    expect(status.status).toBe('ok');
    expect(status.database).toBe('ok');
  });

  it('returns degraded when database throws', async () => {
    const prisma = { $queryRaw: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) } as any;
    const svc    = new HealthService(prisma);
    const status = await svc.check();
    expect(status.status).toBe('degraded');
    expect(status.database).toBe('error');
  });

  it('includes uptime and memory in the response', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([]) } as any;
    const status = await new HealthService(prisma).check();
    expect(status.uptime).toBeGreaterThanOrEqual(0);
    expect(status.memory.rssMB).toBeGreaterThan(0);
  });
});

// ── MetricsInterceptor ────────────────────────────────────────────────────────

function makeContext(method = 'GET', url = '/test', routePath?: string): ExecutionContext {
  const req: Partial<Request> & { route?: { path: string } } = {
    method,
    url,
    ...(routePath != null ? { route: { path: routePath } } : {}),
  };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('MetricsInterceptor', () => {
  let metrics: MetricsService;
  let interceptor: MetricsInterceptor;

  beforeEach(() => {
    metrics     = new MetricsService();
    interceptor = new MetricsInterceptor(metrics);
  });

  it('records a successful request', done => {
    const handler: CallHandler = { handle: () => of('ok') };
    interceptor.intercept(makeContext(), handler).subscribe({
      complete: () => {
        expect(metrics.getSnapshot().totalRequests).toBe(1);
        expect(metrics.getSnapshot().totalErrors).toBe(0);
        done();
      },
    });
  });

  it('records an error request', done => {
    const handler: CallHandler = { handle: () => throwError(() => new Error('fail')) };
    interceptor.intercept(makeContext('POST', '/accounts'), handler).subscribe({
      error: () => {
        expect(metrics.getSnapshot().totalErrors).toBe(1);
        done();
      },
    });
  });

  it('uses route.path pattern when available', done => {
    const handler: CallHandler = { handle: () => of(null) };
    interceptor.intercept(makeContext('GET', '/accounts/42', '/accounts/:id'), handler).subscribe({
      complete: () => {
        const routes = metrics.getSnapshot().routes;
        expect(routes['GET /accounts/:id']).toBeDefined();
        done();
      },
    });
  });

  it('falls back to req.url when no route pattern', done => {
    const handler: CallHandler = { handle: () => of(null) };
    interceptor.intercept(makeContext('DELETE', '/items/5'), handler).subscribe({
      complete: () => {
        const routes = metrics.getSnapshot().routes;
        expect(routes['DELETE /items/5']).toBeDefined();
        done();
      },
    });
  });
});

// ── MonitoringController ──────────────────────────────────────────────────────

describe('MonitoringController', () => {
  const orig = process.env['METRICS_KEY'];

  afterEach(() => {
    process.env['METRICS_KEY'] = orig ?? undefined as any;
    if (orig == null) delete process.env['METRICS_KEY'];
  });

  function makeController(dbOk = true): MonitoringController {
    const prisma  = { $queryRaw: jest.fn().mockResolvedValue(dbOk ? [{}] : undefined) } as any;
    if (!dbOk) prisma.$queryRaw.mockRejectedValue(new Error('db down'));
    const health  = new HealthService(prisma);
    const metrics = new MetricsService();
    return new MonitoringController(health, metrics);
  }

  it('GET /health returns ok status when DB is reachable', async () => {
    const ctrl   = makeController(true);
    const result = await ctrl.health();
    expect(result.status).toBe('ok');
  });

  it('GET /health returns degraded when DB is down', async () => {
    const ctrl   = makeController(false);
    const result = await ctrl.health();
    expect(result.status).toBe('degraded');
  });

  it('GET /metrics returns snapshot when no METRICS_KEY env set', () => {
    delete process.env['METRICS_KEY'];
    const ctrl   = makeController();
    const result = ctrl.getMetrics(undefined);
    expect(result.totalRequests).toBeDefined();
  });

  it('GET /metrics throws UnauthorizedException when key mismatch', () => {
    process.env['METRICS_KEY'] = 'secret-key';
    const ctrl = makeController();
    expect(() => ctrl.getMetrics('wrong-key')).toThrow(UnauthorizedException);
  });

  it('GET /metrics returns snapshot when key matches', () => {
    process.env['METRICS_KEY'] = 'my-secret';
    const ctrl   = makeController();
    const result = ctrl.getMetrics('my-secret');
    expect(result).toBeDefined();
  });
});
