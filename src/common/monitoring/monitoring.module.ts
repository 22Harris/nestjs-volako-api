import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '../../prisma/prisma.module';
import { MetricsService } from './metrics.service';
import { HealthService } from './health.service';
import { MetricsInterceptor } from './metrics.interceptor';
import { MonitoringController } from './monitoring.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MonitoringController],
  providers: [
    MetricsService,
    HealthService,
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
  exports: [MetricsService],
})
export class MonitoringModule {}
