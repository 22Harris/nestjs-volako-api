import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { Request, Response } from 'express';
import { StructuredLoggerService } from './structured-logger.service';
import { CorrelationIdMiddleware, CORRELATION_HEADER } from './correlation-id.middleware';
import { LoggingInterceptor } from './logging.interceptor';
import { correlationStore, getCorrelationId } from './correlation-id.context';

// ── StructuredLoggerService ───────────────────────────────────────────────────

describe('StructuredLoggerService — dev mode', () => {
  let svc: StructuredLoggerService;
  let writeSpy: jest.SpyInstance;
  const orig = process.env['NODE_ENV'];

  beforeEach(() => {
    process.env['NODE_ENV'] = 'development';
    svc = new StructuredLoggerService();
    writeSpy = jest.spyOn(process.stdout, 'write').mockReturnValue(true);
  });

  afterEach(() => {
    process.env['NODE_ENV'] = orig;
    writeSpy.mockRestore();
  });

  it('log() writes a pretty line', () => {
    svc.log('hello world', 'TestCtx');
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining('hello world'));
  });

  it('warn() includes WARN level', () => {
    svc.warn('low disk space', 'System');
    const out = writeSpy.mock.calls[0]?.[0] as string;
    expect(out).toContain('WARN');
  });

  it('error() prints the trace on a second line', () => {
    svc.error('boom', 'Error: boom\n  at line 1', 'App');
    expect(writeSpy).toHaveBeenCalledTimes(2);
    const trace = writeSpy.mock.calls[1]?.[0] as string;
    expect(trace).toContain('Error: boom');
  });

  it('debug() includes DEBUG level', () => {
    svc.debug('debug info');
    const out = writeSpy.mock.calls[0]?.[0] as string;
    expect(out).toContain('DEBUG');
  });

  it('verbose() includes VERBOSE level', () => {
    svc.verbose('verbose info', 'Ctx');
    const out = writeSpy.mock.calls[0]?.[0] as string;
    expect(out).toContain('VERBOSE');
  });

  it('includes correlation ID prefix when running inside correlationStore', done => {
    correlationStore.run('corr-id-1234', () => {
      svc.log('with corr', 'App');
      const out = writeSpy.mock.calls[0]?.[0] as string;
      expect(out).toContain('corr-id-'); // abbreviated first 8 chars
      done();
    });
  });
});

describe('StructuredLoggerService — prod mode', () => {
  let svc: StructuredLoggerService;
  let writeSpy: jest.SpyInstance;
  const orig = process.env['NODE_ENV'];

  beforeEach(() => {
    process.env['NODE_ENV'] = 'production';
    svc = new StructuredLoggerService();
    writeSpy = jest.spyOn(process.stdout, 'write').mockReturnValue(true);
  });

  afterEach(() => {
    process.env['NODE_ENV'] = orig;
    writeSpy.mockRestore();
  });

  it('emits valid JSON', () => {
    svc.log('prod message', 'App');
    const line = (writeSpy.mock.calls[0]?.[0] as string).trim();
    expect(() => JSON.parse(line)).not.toThrow();
  });

  it('JSON contains required fields', () => {
    svc.log('test', 'ProdCtx');
    const obj = JSON.parse((writeSpy.mock.calls[0]?.[0] as string).trim());
    expect(obj).toMatchObject({ level: 'info', context: 'ProdCtx', message: 'test' });
    expect(obj.timestamp).toBeTruthy();
  });

  it('JSON includes correlationId when present', done => {
    correlationStore.run('prod-corr-xyz', () => {
      svc.log('corr test', 'Ctx');
      const obj = JSON.parse((writeSpy.mock.calls[0]?.[0] as string).trim());
      expect(obj.correlationId).toBe('prod-corr-xyz');
      done();
    });
  });

  it('error JSON includes trace field', () => {
    svc.error('fail', 'stack here', 'ErrCtx');
    const obj = JSON.parse((writeSpy.mock.calls[0]?.[0] as string).trim());
    expect(obj.trace).toBe('stack here');
    expect(obj.level).toBe('error');
  });
});

// ── CorrelationIdMiddleware ───────────────────────────────────────────────────

describe('CorrelationIdMiddleware', () => {
  const middleware = new CorrelationIdMiddleware();

  function makeReq(headers: Record<string, string> = {}): Partial<Request> {
    return { headers };
  }

  function makeRes(): { headers: Record<string, string>; setHeader: jest.Mock } {
    const headers: Record<string, string> = {};
    return { headers, setHeader: jest.fn((k: string, v: string) => { headers[k] = v; }) };
  }

  it('sets X-Correlation-Id response header', done => {
    const req = makeReq() as Request;
    const res = makeRes() as unknown as Response;
    middleware.use(req, res, () => {
      expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-Id', expect.any(String));
      done();
    });
  });

  it('uses provided correlation ID from request header', done => {
    const req = makeReq({ [CORRELATION_HEADER]: 'my-id-123' }) as Request;
    const res = makeRes() as unknown as Response;
    middleware.use(req, res, () => {
      expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-Id', 'my-id-123');
      done();
    });
  });

  it('generates a UUID when no correlation ID header provided', done => {
    const req = makeReq() as Request;
    const res = makeRes() as unknown as Response;
    middleware.use(req, res, () => {
      const id: string = (res.setHeader as jest.Mock).mock.calls[0]?.[1] as string;
      expect(id).toMatch(/^[0-9a-f-]{36}$/);
      done();
    });
  });

  it('propagates correlation ID via AsyncLocalStorage', done => {
    const req = makeReq({ [CORRELATION_HEADER]: 'ctx-propagate' }) as Request;
    const res = makeRes() as unknown as Response;
    middleware.use(req, res, () => {
      expect(getCorrelationId()).toBe('ctx-propagate');
      done();
    });
  });
});

// ── LoggingInterceptor ────────────────────────────────────────────────────────

function makeContext(method = 'GET', url = '/test', statusCode = 200): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest:  () => ({ method, url }) as Partial<Request>,
      getResponse: () => ({ statusCode }) as Partial<Response>,
    }),
  } as unknown as ExecutionContext;
}

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    logSpy = jest.spyOn((interceptor as any).logger, 'log').mockImplementation(() => {});
    jest.spyOn((interceptor as any).logger, 'error').mockImplementation(() => {});
  });

  it('logs the request on success', done => {
    const handler: CallHandler = { handle: () => of({ data: 'ok' }) };
    interceptor.intercept(makeContext(), handler).subscribe({
      complete: () => {
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('GET /test 200'));
        done();
      },
    });
  });

  it('includes response time in log', done => {
    const handler: CallHandler = { handle: () => of(null) };
    interceptor.intercept(makeContext(), handler).subscribe({
      complete: () => {
        const msg = logSpy.mock.calls[0]?.[0] as string;
        expect(msg).toMatch(/\+\d+ms/);
        done();
      },
    });
  });

  it('logs error on observable failure', done => {
    const errSpy = jest.spyOn((interceptor as any).logger, 'error');
    const handler: CallHandler = { handle: () => throwError(() => new Error('internal')) };
    interceptor.intercept(makeContext('POST', '/api/data'), handler).subscribe({
      error: () => {
        expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('internal'));
        done();
      },
    });
  });

  it('handles non-Error thrown values gracefully', done => {
    const errSpy = jest.spyOn((interceptor as any).logger, 'error');
    const handler: CallHandler = { handle: () => throwError(() => 'string error') };
    interceptor.intercept(makeContext(), handler).subscribe({
      error: () => {
        expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('string error'));
        done();
      },
    });
  });
});

// ── getCorrelationId outside store ────────────────────────────────────────────

describe('getCorrelationId', () => {
  it('returns undefined when called outside a correlationStore.run() context', () => {
    expect(getCorrelationId()).toBeUndefined();
  });

  it('returns the correlation ID within the run context', done => {
    correlationStore.run('test-id-abc', () => {
      expect(getCorrelationId()).toBe('test-id-abc');
      done();
    });
  });
});
