import { Controller, Get, HttpCode, HttpStatus, UnauthorizedException, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { MetricsService } from './metrics.service';
import type { MetricsSnapshot } from './metrics.service';
import type { HealthStatus } from './health.service';

@ApiTags('Monitoring')
@Controller()
export class MonitoringController {
  constructor(
    private readonly healthService: HealthService,
    private readonly metricsService: MetricsService,
  ) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Application health check' })
  async health(): Promise<HealthStatus> {
    return this.healthService.check();
  }

  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Application metrics (requires X-Metrics-Key header)' })
  getMetrics(@Headers('x-metrics-key') key: string | undefined): MetricsSnapshot {
    this.assertMetricsKey(key);
    return this.metricsService.getSnapshot();
  }

  private assertMetricsKey(key: string | undefined): void {
    const expected = process.env['METRICS_KEY'];
    if (expected != null && key !== expected) {
      throw new UnauthorizedException('Invalid or missing X-Metrics-Key header.');
    }
  }
}
