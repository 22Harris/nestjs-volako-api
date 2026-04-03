import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { TauxChangeService } from './taux-change.service';

@Controller('taux-change')
@UseGuards(JwtAuthGuard)
export class TauxChangeController {
  constructor(private readonly tauxChangeService: TauxChangeService) {}

  /** GET /taux-change/latest — taux EUR du jour */
  @Get('latest')
  getLatest() {
    return this.tauxChangeService.getLatest();
  }

  /**
   * GET /taux-change/historical?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&to=USD,GBP
   * Historique des taux sur une plage de dates
   */
  @Get('historical')
  getHistorical(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('to') to?: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('Les paramètres startDate et endDate sont requis');
    }
    return this.tauxChangeService.getHistorical(startDate, endDate, to);
  }
}
