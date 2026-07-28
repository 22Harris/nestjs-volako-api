import { Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { BackupService } from './backup.service';

@ApiTags('backup')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('trigger')
  @HttpCode(200)
  @ApiOperation({ summary: 'Déclencher une sauvegarde manuelle de la base de données' })
  @ApiResponse({ status: 200, description: 'Résultat de la sauvegarde' })
  trigger() {
    return this.backupService.runBackup();
  }

  @Get()
  @ApiOperation({ summary: 'Lister les sauvegardes disponibles' })
  list() {
    return this.backupService.listBackups();
  }
}
