import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

interface LogParams {
  userId?: number;
  action: string;
  entity?: string;
  entityId?: number;
  details?: string;
  ip?: string;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: LogParams): Promise<void> {
    await this.prisma.auditLog.create({ data: params });
  }
}
