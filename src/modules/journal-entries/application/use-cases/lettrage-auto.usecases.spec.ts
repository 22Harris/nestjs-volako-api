import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AutoLettrerLignesUseCase } from './auto-lettrer-lignes.usecase';
import { GetLignesCompteUseCase } from './get-lignes-compte.usecase';
import type { LineForLettrage } from '../ports/journal-entries.repository.interface';

const mockRepo = {
  getUnletteredLines: jest.fn(),
  getLinesForAccount: jest.fn(),
  lettrerLignes: jest.fn(),
};

const USER_ID = 1;
const ACCOUNT_ID = 401;

function makeLine(id: number, debit: number, credit: number, lettre: string | null = null): LineForLettrage {
  return {
    id,
    debit,
    credit,
    lettre,
    date: new Date('2025-01-15'),
    entryLabel: `Écriture ${id}`,
    pieceNumber: `BQ-2025-${String(id).padStart(5, '0')}`,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRepo.lettrerLignes.mockResolvedValue('A');
});

// ── AutoLettrerLignesUseCase ───────────────────────────────────────────────────

describe('AutoLettrerLignesUseCase', () => {
  function uc() { return new AutoLettrerLignesUseCase(mockRepo as any); }

  it('apparie 2 lignes équilibrées (1:1) et retourne les stats', async () => {
    mockRepo.getUnletteredLines.mockResolvedValue([
      makeLine(1, 10000, 0),  // net +10000
      makeLine(2, 0, 10000),  // net -10000
    ]);

    const result = await uc().execute(ACCOUNT_ID, USER_ID);

    expect(result.groupes).toBe(1);
    expect(result.lignes).toBe(2);
    expect(mockRepo.lettrerLignes).toHaveBeenCalledWith([1, 2], USER_ID);
  });

  it('apparie plusieurs paires 1:1 indépendantes', async () => {
    mockRepo.getUnletteredLines.mockResolvedValue([
      makeLine(1, 5000, 0),
      makeLine(2, 0, 5000),
      makeLine(3, 3000, 0),
      makeLine(4, 0, 3000),
    ]);
    mockRepo.lettrerLignes.mockResolvedValueOnce('A').mockResolvedValueOnce('B');

    const result = await uc().execute(ACCOUNT_ID, USER_ID);

    expect(result.groupes).toBe(2);
    expect(result.lignes).toBe(4);
    expect(mockRepo.lettrerLignes).toHaveBeenCalledTimes(2);
  });

  it('apparie un groupe multi-lignes (2:1) non trouvé en 1:1', async () => {
    // 2000 + 3000 = 5000 → groupe de 3 lignes
    mockRepo.getUnletteredLines.mockResolvedValue([
      makeLine(1, 2000, 0),  // net +2000
      makeLine(2, 3000, 0),  // net +3000
      makeLine(3, 0, 5000),  // net -5000
    ]);

    const result = await uc().execute(ACCOUNT_ID, USER_ID);

    expect(result.groupes).toBe(1);
    expect(result.lignes).toBe(3);
    expect(mockRepo.lettrerLignes).toHaveBeenCalledWith(
      expect.arrayContaining([1, 2, 3]),
      USER_ID,
    );
  });

  it('lève NotFoundException si aucune ligne non lettrée', async () => {
    mockRepo.getUnletteredLines.mockResolvedValue([]);
    await expect(uc().execute(ACCOUNT_ID, USER_ID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève BadRequestException si aucun groupe équilibré trouvé', async () => {
    // Une seule ligne débit sans contrepartie crédit
    mockRepo.getUnletteredLines.mockResolvedValue([
      makeLine(1, 10000, 0),
      makeLine(2, 7000, 0),
    ]);
    await expect(uc().execute(ACCOUNT_ID, USER_ID)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('ignore les lignes à solde net zéro (debit === credit)', async () => {
    mockRepo.getUnletteredLines.mockResolvedValue([
      makeLine(1, 5000, 5000), // net 0 — ignorée pour l'appariement
      makeLine(2, 10000, 0),
      makeLine(3, 0, 10000),
    ]);

    const result = await uc().execute(ACCOUNT_ID, USER_ID);
    expect(result.groupes).toBe(1);
    expect(result.lignes).toBe(2);
  });
});

// ── GetLignesCompteUseCase ─────────────────────────────────────────────────────

describe('GetLignesCompteUseCase', () => {
  function uc() { return new GetLignesCompteUseCase(mockRepo as any); }

  it('sépare les lignes non lettrées des groupes lettrés', async () => {
    mockRepo.getLinesForAccount.mockResolvedValue([
      makeLine(1, 10000, 0, null),
      makeLine(2, 0, 10000, 'A'),
      makeLine(3, 5000, 0, 'A'),
      makeLine(4, 3000, 0, null),
    ]);

    const result = await uc().execute(ACCOUNT_ID, USER_ID);

    expect(result.nonLettrees).toHaveLength(2);
    expect(result.nonLettrees.map(l => l.id)).toEqual([1, 4]);
    expect(result.groupes['A']).toHaveLength(2);
    expect(result.groupes['A'].map(l => l.id)).toEqual([2, 3]);
  });

  it('retourne des listes vides si aucune ligne', async () => {
    mockRepo.getLinesForAccount.mockResolvedValue([]);

    const result = await uc().execute(ACCOUNT_ID, USER_ID);

    expect(result.nonLettrees).toHaveLength(0);
    expect(Object.keys(result.groupes)).toHaveLength(0);
  });

  it('gère plusieurs groupes de lettrage distincts', async () => {
    mockRepo.getLinesForAccount.mockResolvedValue([
      makeLine(1, 0, 10000, 'A'),
      makeLine(2, 10000, 0, 'A'),
      makeLine(3, 0, 5000, 'B'),
      makeLine(4, 5000, 0, 'B'),
    ]);

    const result = await uc().execute(ACCOUNT_ID, USER_ID);

    expect(result.nonLettrees).toHaveLength(0);
    expect(Object.keys(result.groupes)).toHaveLength(2);
    expect(result.groupes['A']).toHaveLength(2);
    expect(result.groupes['B']).toHaveLength(2);
  });
});
