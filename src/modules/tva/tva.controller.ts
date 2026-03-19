import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { TvaService } from './tva.service';

@Controller('tva')
@UseGuards(JwtAuthGuard)
export class TvaController {
  constructor(private readonly tvaService: TvaService) {}

  /**
   * Déclaration TVA CA3
   * GET /tva/ca3?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
   */
  @Get('ca3')
  getCa3(
    @CurrentUser() userId: number,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    if (!dateFrom || !dateTo) {
      throw new BadRequestException('Les paramètres dateFrom et dateTo sont requis');
    }
    return this.tvaService.getCa3(userId, dateFrom, dateTo);
  }
}
