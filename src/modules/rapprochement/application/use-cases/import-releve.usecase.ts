import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { RAPPROCHEMENT_REPOSITORY } from '../ports/rapprochement.repository.token';
import type { RapprochementRepository, ImportReleveData } from '../ports/rapprochement.repository.interface';
import { CsvParser } from '../../infrastructure/parsers/csv.parser';
import { OfxParser } from '../../infrastructure/parsers/ofx.parser';

@Injectable()
export class ImportReleveUseCase {
  constructor(
    @Inject(RAPPROCHEMENT_REPOSITORY)
    private readonly repo: RapprochementRepository,
  ) {}

  async execute(
    filename: string,
    buffer: Buffer,
    userId: number,
  ) {
    const ext = filename.toLowerCase().split('.').pop();
    let data: ImportReleveData;

    if (ext === 'csv') {
      data = CsvParser.parse(buffer.toString('utf-8'), filename);
    } else if (ext === 'ofx' || ext === 'qfx') {
      data = OfxParser.parse(buffer.toString('utf-8'), filename);
    } else {
      throw new BadRequestException('Format non supporté. Utilisez CSV ou OFX.');
    }

    if (data.lignes.length === 0) {
      throw new BadRequestException('Aucune transaction trouvée dans le fichier.');
    }

    return this.repo.createReleve(data, userId);
  }
}
