import { Inject, Injectable } from '@nestjs/common';
import { COMPTE_BANK_REPOSITORY } from '../ports/compte-bank.repository.interface';
import type { CompteBankRepository } from '../ports/compte-bank.repository.interface';
import { CompteBank } from '../../domain/entities/compte-bank.entity';

@Injectable()
export class ListerComptesBankUseCase {
  constructor(
    @Inject(COMPTE_BANK_REPOSITORY)
    private readonly repo: CompteBankRepository,
  ) {}

  execute(userId: number): Promise<CompteBank[]> {
    return this.repo.findAll(userId);
  }
}
