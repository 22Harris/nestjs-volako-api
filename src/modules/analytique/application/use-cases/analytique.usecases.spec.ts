import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateCentreAnalytiqueUseCase } from './create-centre.usecase';
import { UpdateCentreAnalytiqueUseCase } from './update-centre.usecase';
import { DeleteCentreAnalytiqueUseCase } from './delete-centre.usecase';
import { AffecterLignesAnalytiquesUseCase } from './affecter-lignes.usecase';
import { GetBalanceAnalytiqueUseCase } from './get-balance-analytique.usecase';
import { ListCentresAnalytiquesUseCase } from './list-centres.usecase';
import { CentreAnalytique } from '../../domain/entities/centre-analytique.entity';

const MKTG = new CentreAnalytique('MKTG', 'Marketing', 1, 1);
const IT = new CentreAnalytique('IT', 'Informatique', 1, 2);

function makeRepo(overrides: Record<string, jest.Mock> = {}) {
  return {
    createCentre: jest.fn().mockResolvedValue(MKTG),
    findAllCentres: jest.fn().mockResolvedValue([MKTG, IT]),
    findCentreById: jest.fn().mockResolvedValue(MKTG),
    updateCentre: jest.fn().mockResolvedValue(new CentreAnalytique('COMM', 'Communication', 1, 1)),
    deleteCentre: jest.fn().mockResolvedValue(undefined),
    affecter: jest.fn().mockResolvedValue([]),
    getAffectations: jest.fn().mockResolvedValue([]),
    getBalance: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

// ── CreateCentreAnalytiqueUseCase ─────────────────────────────────────────
describe('CreateCentreAnalytiqueUseCase', () => {
  it('crée un centre si le code est unique', async () => {
    const repo = makeRepo({ findAllCentres: jest.fn().mockResolvedValue([]) });
    const result = await new CreateCentreAnalytiqueUseCase(repo as any).execute('MKTG', 'Marketing', 1);
    expect(repo.createCentre).toHaveBeenCalledWith('MKTG', 'Marketing', 1);
    expect(result).toBe(MKTG);
  });

  it('lève ConflictException si le code existe déjà', async () => {
    const repo = makeRepo();
    await expect(
      new CreateCentreAnalytiqueUseCase(repo as any).execute('MKTG', 'Autre', 1),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

// ── ListCentresAnalytiquesUseCase ─────────────────────────────────────────
describe('ListCentresAnalytiquesUseCase', () => {
  it('retourne tous les centres', async () => {
    const repo = makeRepo();
    const result = await new ListCentresAnalytiquesUseCase(repo as any).execute(1);
    expect(result).toHaveLength(2);
  });
});

// ── UpdateCentreAnalytiqueUseCase ─────────────────────────────────────────
describe('UpdateCentreAnalytiqueUseCase', () => {
  it('met à jour un centre existant', async () => {
    const repo = makeRepo();
    await new UpdateCentreAnalytiqueUseCase(repo as any).execute(1, 'COMM', 'Communication', 1);
    expect(repo.updateCentre).toHaveBeenCalledWith(1, 'COMM', 'Communication', 1);
  });

  it('lève NotFoundException si centre introuvable', async () => {
    const repo = makeRepo({ findCentreById: jest.fn().mockResolvedValue(null) });
    await expect(
      new UpdateCentreAnalytiqueUseCase(repo as any).execute(99, 'X', 'X', 1),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève ConflictException si le nouveau code est pris par un autre centre', async () => {
    const repo = makeRepo({
      findCentreById: jest.fn().mockResolvedValue(MKTG),
    });
    // IT a le code "IT" (id=2), on essaie de mettre à jour MKTG (id=1) vers "IT"
    await expect(
      new UpdateCentreAnalytiqueUseCase(repo as any).execute(1, 'IT', 'Infra', 1),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

// ── DeleteCentreAnalytiqueUseCase ─────────────────────────────────────────
describe('DeleteCentreAnalytiqueUseCase', () => {
  it('supprime un centre sans mouvements', async () => {
    const repo = makeRepo({ getBalance: jest.fn().mockResolvedValue([]) });
    await new DeleteCentreAnalytiqueUseCase(repo as any).execute(1, 1);
    expect(repo.deleteCentre).toHaveBeenCalledWith(1, 1);
  });

  it('lève NotFoundException si centre introuvable', async () => {
    const repo = makeRepo({ findCentreById: jest.fn().mockResolvedValue(null) });
    await expect(
      new DeleteCentreAnalytiqueUseCase(repo as any).execute(99, 1),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève BadRequestException si le centre a des mouvements', async () => {
    const repo = makeRepo({
      getBalance: jest.fn().mockResolvedValue([
        { centre: MKTG, debit: 5000, credit: 0, solde: 5000 },
      ]),
    });
    await expect(
      new DeleteCentreAnalytiqueUseCase(repo as any).execute(1, 1),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

// ── AffecterLignesAnalytiquesUseCase ──────────────────────────────────────
describe('AffecterLignesAnalytiquesUseCase', () => {
  it('accepte une affectation à 100 %', async () => {
    const repo = makeRepo();
    await new AffecterLignesAnalytiquesUseCase(repo as any).execute(
      10,
      [{ centreId: 1, pourcentage: 100 }],
      1,
    );
    expect(repo.affecter).toHaveBeenCalledWith(10, [{ centreId: 1, pourcentage: 100 }]);
  });

  it('accepte une ventilation 60/40', async () => {
    const repo = makeRepo({ findCentreById: jest.fn().mockResolvedValue(MKTG) });
    await new AffecterLignesAnalytiquesUseCase(repo as any).execute(
      10,
      [{ centreId: 1, pourcentage: 60 }, { centreId: 2, pourcentage: 40 }],
      1,
    );
    expect(repo.affecter).toHaveBeenCalled();
  });

  it('lève BadRequestException si somme ≠ 100', async () => {
    const repo = makeRepo();
    await expect(
      new AffecterLignesAnalytiquesUseCase(repo as any).execute(
        10,
        [{ centreId: 1, pourcentage: 60 }, { centreId: 2, pourcentage: 30 }],
        1,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lève BadRequestException si liste vide', async () => {
    const repo = makeRepo();
    await expect(
      new AffecterLignesAnalytiquesUseCase(repo as any).execute(10, [], 1),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lève BadRequestException si un pourcentage est à 0', async () => {
    const repo = makeRepo();
    await expect(
      new AffecterLignesAnalytiquesUseCase(repo as any).execute(
        10,
        [{ centreId: 1, pourcentage: 0 }, { centreId: 2, pourcentage: 100 }],
        1,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lève NotFoundException si un centre est introuvable', async () => {
    const repo = makeRepo({ findCentreById: jest.fn().mockResolvedValue(null) });
    await expect(
      new AffecterLignesAnalytiquesUseCase(repo as any).execute(
        10,
        [{ centreId: 99, pourcentage: 100 }],
        1,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ── GetBalanceAnalytiqueUseCase ───────────────────────────────────────────
describe('GetBalanceAnalytiqueUseCase', () => {
  it('délègue au repository avec les filtres optionnels', async () => {
    const repo = makeRepo({
      getBalance: jest.fn().mockResolvedValue([
        { centre: MKTG, debit: 10000, credit: 0, solde: 10000 },
      ]),
    });
    const d1 = new Date('2026-01-01');
    const d2 = new Date('2026-12-31');
    const result = await new GetBalanceAnalytiqueUseCase(repo as any).execute(1, d1, d2);
    expect(repo.getBalance).toHaveBeenCalledWith(1, d1, d2);
    expect(result[0].solde).toBe(10000);
  });

  it('fonctionne sans filtres de date', async () => {
    const repo = makeRepo();
    await new GetBalanceAnalytiqueUseCase(repo as any).execute(1);
    expect(repo.getBalance).toHaveBeenCalledWith(1, undefined, undefined);
  });
});
