import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GetFacturesEnRetardUseCase } from './get-factures-en-retard.usecase';
import { CreateRelanceUseCase } from './create-relance.usecase';
import { GetRelancesUseCase } from './get-relances.usecase';
import { GenerateLettreRelanceUseCase } from './generate-lettre-relance.usecase';
import { Relance, FactureEnRetard } from '../../domain/entities/relance.entity';

const NOW = new Date('2026-05-19T10:00:00Z');
const ECHEANCE_PASSEE = new Date('2026-05-05T00:00:00Z');

const factureEnRetard: FactureEnRetard = {
  id: 1,
  numero: 'F-2026-001',
  montant: 120000,
  resteAPayer: 120000,
  dateEcheance: ECHEANCE_PASSEE,
  joursRetard: 14,
  tiersId: 10,
  tiersNom: 'Client Alpha',
  tiersEmail: 'alpha@example.com',
  niveauRelanceSuivant: 1,
};

function makeRepo(overrides: Partial<{
  getFacturesEnRetard: jest.Mock;
  create: jest.Mock;
  findAll: jest.Mock;
}> = {}) {
  return {
    getFacturesEnRetard: jest.fn().mockResolvedValue([factureEnRetard]),
    create: jest.fn().mockResolvedValue(
      new Relance(1, 1, NOW, 99, undefined, 'F-2026-001', 120000, 120000, ECHEANCE_PASSEE, 'Client Alpha', 'alpha@example.com'),
    ),
    findAll: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
describe('GetFacturesEnRetardUseCase', () => {
  it('délègue au repository', async () => {
    const repo = makeRepo();
    const uc = new GetFacturesEnRetardUseCase(repo as any);
    const result = await uc.execute(1);
    expect(result).toHaveLength(1);
    expect(result[0].numero).toBe('F-2026-001');
    expect(repo.getFacturesEnRetard).toHaveBeenCalledWith(1);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe('CreateRelanceUseCase', () => {
  it('crée une relance niveau 1 pour une facture en retard', async () => {
    const repo = makeRepo();
    const uc = new CreateRelanceUseCase(repo as any);
    const result = await uc.execute(1, 'Premier rappel', 1);
    expect(repo.create).toHaveBeenCalledWith(1, 1, 'Premier rappel', 1);
    expect(result.niveau).toBe(1);
  });

  it('lève NotFoundException si la facture n\'est pas en retard', async () => {
    const repo = makeRepo({ getFacturesEnRetard: jest.fn().mockResolvedValue([]) });
    const uc = new CreateRelanceUseCase(repo as any);
    await expect(uc.execute(99, undefined, 1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève BadRequestException si niveau > 3', async () => {
    const repo = makeRepo({
      getFacturesEnRetard: jest.fn().mockResolvedValue([
        { ...factureEnRetard, niveauRelanceSuivant: 4 },
      ]),
    });
    const uc = new CreateRelanceUseCase(repo as any);
    await expect(uc.execute(1, undefined, 1)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('passe la note optionnelle', async () => {
    const repo = makeRepo();
    const uc = new CreateRelanceUseCase(repo as any);
    await uc.execute(1, undefined, 1);
    expect(repo.create).toHaveBeenCalledWith(1, 1, undefined, 1);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe('GetRelancesUseCase', () => {
  it('liste toutes les relances d\'un user', async () => {
    const relances = [new Relance(1, 1, NOW, 10)];
    const repo = makeRepo({ findAll: jest.fn().mockResolvedValue(relances) });
    const uc = new GetRelancesUseCase(repo as any);
    const result = await uc.execute(1);
    expect(result).toBe(relances);
    expect(repo.findAll).toHaveBeenCalledWith(1, undefined);
  });

  it('filtre par factureId si fourni', async () => {
    const repo = makeRepo({ findAll: jest.fn().mockResolvedValue([]) });
    const uc = new GetRelancesUseCase(repo as any);
    await uc.execute(1, 42);
    expect(repo.findAll).toHaveBeenCalledWith(1, 42);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe('GenerateLettreRelanceUseCase', () => {
  it('génère une lettre HTML pour une facture en retard', async () => {
    const repo = makeRepo();
    const uc = new GenerateLettreRelanceUseCase(repo as any);
    const result = await uc.execute(1, 1);
    expect(result.factureId).toBe(1);
    expect(result.niveau).toBe(1);
    expect(result.tiersNom).toBe('Client Alpha');
    expect(result.html).toContain('<!DOCTYPE html>');
    expect(result.html).toContain('F-2026-001');
    expect(result.html).toContain('Client Alpha');
    expect(result.html).toContain('Rappel de paiement');
  });

  it('utilise le titre "Deuxième relance" pour niveau 2', async () => {
    const repo = makeRepo({
      getFacturesEnRetard: jest.fn().mockResolvedValue([
        { ...factureEnRetard, niveauRelanceSuivant: 2 },
      ]),
    });
    const uc = new GenerateLettreRelanceUseCase(repo as any);
    const result = await uc.execute(1, 1);
    expect(result.html).toContain('Deuxi');
  });

  it('utilise le titre "Mise en demeure" pour niveau 3', async () => {
    const repo = makeRepo({
      getFacturesEnRetard: jest.fn().mockResolvedValue([
        { ...factureEnRetard, niveauRelanceSuivant: 3 },
      ]),
    });
    const uc = new GenerateLettreRelanceUseCase(repo as any);
    const result = await uc.execute(1, 1);
    expect(result.html).toContain('Mise en demeure');
  });

  it('plafonne le niveau à 3 même si niveauRelanceSuivant > 3', async () => {
    const repo = makeRepo({
      getFacturesEnRetard: jest.fn().mockResolvedValue([
        { ...factureEnRetard, niveauRelanceSuivant: 5 },
      ]),
    });
    const uc = new GenerateLettreRelanceUseCase(repo as any);
    const result = await uc.execute(1, 1);
    expect(result.niveau).toBe(3);
  });

  it('lève NotFoundException si facture introuvable', async () => {
    const repo = makeRepo({ getFacturesEnRetard: jest.fn().mockResolvedValue([]) });
    const uc = new GenerateLettreRelanceUseCase(repo as any);
    await expect(uc.execute(999, 1)).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe('Relance.joursRetard', () => {
  it('calcule le retard depuis dateEcheance', () => {
    const echeance = new Date(Date.now() - 14 * 86_400_000);
    const r = new Relance(1, 1, new Date(), 1, undefined, undefined, undefined, undefined, echeance);
    expect(r.joursRetard).toBe(14);
  });

  it('retourne 0 si pas de dateEcheance', () => {
    const r = new Relance(1, 1, NOW, 1);
    expect(r.joursRetard).toBe(0);
  });
});
