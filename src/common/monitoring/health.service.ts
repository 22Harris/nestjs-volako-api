import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  uptime: number;
  database: 'ok' | 'error';
  memory: { rssMB: number; heapUsedMB: number; heapTotalMB: number };
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthStatus> {
    const dbStatus  = await this.pingDatabase();
    const mem       = process.memoryUsage();

    return {
      status:   dbStatus === 'ok' ? 'ok' : 'degraded',
      uptime:   Math.round(process.uptime() * 10) / 10,
      database: dbStatus,
      memory: {
        rssMB:       Math.round(mem.rss       / 1_048_576),
        heapUsedMB:  Math.round(mem.heapUsed  / 1_048_576),
        heapTotalMB: Math.round(mem.heapTotal / 1_048_576),
      },
    };
  }

  private async pingDatabase(): Promise<'ok' | 'error'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch {
      return 'error';
    }
  }
}
