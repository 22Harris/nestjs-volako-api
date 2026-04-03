import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.AUDITEUR)
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit ? Number(limit) : 100,
      skip: offset ? Number(offset) : 0,
    });
  }
}
