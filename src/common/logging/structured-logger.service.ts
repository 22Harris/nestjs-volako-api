import { Injectable, LoggerService } from '@nestjs/common';
import { getCorrelationId } from './correlation-id.context';

interface LogEntry {
  level: string;
  timestamp: string;
  context?: string;
  correlationId?: string;
  message: string;
  trace?: string;
}

@Injectable()
export class StructuredLoggerService implements LoggerService {
  private readonly isProd = process.env['NODE_ENV'] === 'production';

  log(message: unknown, context?: string): void {
    this.write('info', String(message), context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.write('error', String(message), context, trace);
  }

  warn(message: unknown, context?: string): void {
    this.write('warn', String(message), context);
  }

  debug(message: unknown, context?: string): void {
    this.write('debug', String(message), context);
  }

  verbose(message: unknown, context?: string): void {
    this.write('verbose', String(message), context);
  }

  private write(level: string, message: string, context?: string, trace?: string): void {
    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      context,
      correlationId: getCorrelationId(),
      message,
      ...(trace != null ? { trace } : {}),
    };

    if (this.isProd) {
      process.stdout.write(JSON.stringify(entry) + '\n');
    } else {
      this.writePretty(entry);
    }
  }

  private writePretty(entry: LogEntry): void {
    const lvl    = entry.level.toUpperCase().padEnd(7);
    const ctx    = entry.context ?? 'App';
    const corrId = entry.correlationId ? ` (${entry.correlationId.slice(0, 8)})` : '';
    process.stdout.write(`[${lvl}] ${ctx}${corrId} — ${entry.message}\n`);
    if (entry.trace != null) {
      process.stdout.write(`        ${entry.trace}\n`);
    }
  }
}
