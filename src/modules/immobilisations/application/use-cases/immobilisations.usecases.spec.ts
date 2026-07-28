import { BadRequestException, NotFoundException } from '@nestjs/common';
import { calculerTableauAmortissement } from '../utils/amortissement.calculator';
import { CreateImmobilisationUseCase } from './create-immobilisation.usecase';
import { FindImmobilisationsUseCase } from './find-immobilisations.usecase';
import { GetImmobilisationUseCase } from './get-immobilisation.usecase';
import { DeleteImmobilisationUseCase } from './delete-immobilisation.usecase';
import { ComptabiliserDotationUseCase } from './comptabiliser-dotation.usecase';
import { CederImmobilisationUseCase } from './ceder-immobilisation.usecase';
import { Immobilisation, LigneAmortissement } from '../../domain/entities/immobilisation.entity';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockImmoRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  setStatutCede: jest.fn(),
  delete: jest.fn(),
  markDotationComptabilisee: jest.fn(),
};

const mockJeRepo = {
  createJournalEntry: jest.fn(),
  getAccountBalances: jest.fn(),
};

const USER_ID = 1;

function makeImmo(overrides: Partial<Immobilisation> = {}): Immobilisation {
  return new Immobilisation(
    'Ordinateur portable',
    new Date('2025-01-01'),
    150000,
    3,
    'LINEAIRE',
    '2183',
    '2813',
    '6811',
    'ACTIF',
    [
      new LigneAmortissement(2025, 50000, 50000, 100000, false, 1),
      new LigneAmortissement(2026, 50000, 100000, 50000, false, 2),
      new LigneAmortissement(2027, 50000, 150000, 0, false, 3),
    ],
    1,
    USER_ID,
    ...([overrides] as any),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockImmoRepo.create.mockResolvedValue(makeImmo());
  mockImmoRepo.findAll.mockResolvedValue([makeImmo()]);
  mockImmoRepo.findById.mockResolvedValue(makeImmo());
  mockImmoRepo.setStatutCede.mockResolvedValue(undefined);
  mockImmoRepo.delete.mockResolvedValue(undefined);
  mockImmoRepo.markDotationComptabilisee.mockResolvedValue(undefined);
  mockJeRepo.createJournalEntry.mockResolvedValue({ id: 99 });
  mockJeRepo.getAccountBalances.mockResolvedValue([
    { accountId: 10, accountCode: '6811', accountName: 'Dotations amortissements', totalDebit: 0, totalCredit: 0 },
    { accountId: 11, accountCode: '2813', accountName: 'Amort matériel info', totalDebit: 0, totalCredit: 0 },
    { accountId: 12, accountCode: '2183', accountName: 'Matériel info', totalDebit: 0, totalCredit: 0 },
    { accountId: 13, accountCode: '675', accountName: 'VNC cédée', totalDebit: 0, totalCredit: 0 },
    { accountId: 14, accountCode: '775', accountName: 'Produit de cession', totalDebit: 0, totalCredit: 0 },
    { accountId: 15, accountCode: '462', accountName: 'Débiteurs cession', totalDebit: 0, totalCredit: 0 },
  ]);
});

// ── Calculateur d'amortissement ────────────────────────────────────────────────

describe('calculerTableauAmortissement', () => {
  describe('Méthode LINEAIRE', () => {
    it('génère le bon nombre d\'annuités pour acquisition en début d\'année', () => {
      const lignes = calculerTableauAmortissement(150000, 3, 'LINEAIRE', new Date('2025-01-01'));
      expect(lignes).toHaveLength(3);
    });

    it('génère N+1 annuités si prorata temporis (acquisition en cours d\'année)', () => {
      const lignes = calculerTableauAmortissement(120000, 3, 'LINEAIRE', new Date('2025-07-01'));
      expect(lignes.length).toBeGreaterThan(3);
    });

    it('la somme des dotations = valeur brute', () => {
      const lignes = calculerTableauAmortissement(150000, 3, 'LINEAIRE', new Date('2025-01-01'));
      const total = lignes.reduce((s, l) => s + l.dotation, 0);
      expect(total).toBe(150000);
    });

    it('la VNC finale est zéro', () => {
      const lignes = calculerTableauAmortissement(150000, 3, 'LINEAIRE', new Date('2025-01-01'));
      expect(lignes[lignes.length - 1].valeurNetteComptable).toBe(0);
    });

    it('les cumuls sont croissants et le dernier = valeurBrute', () => {
      const lignes = calculerTableauAmortissement(150000, 3, 'LINEAIRE', new Date('2025-01-01'));
      const cumuls = lignes.map(l => l.cumulAmortissement);
      for (let i = 1; i < cumuls.length; i++) {
        expect(cumuls[i]).toBeGreaterThan(cumuls[i - 1]);
      }
      expect(cumuls[cumuls.length - 1]).toBe(150000);
    });

    it('applique le prorata temporis correctement (juillet = 6 mois)', () => {
      const lignes = calculerTableauAmortissement(120000, 3, 'LINEAIRE', new Date('2025-07-15'));
      // Première année : 6 mois sur 12 → 120000/3 * 6/12 = 20000
      expect(lignes[0].dotation).toBe(20000);
    });
  });

  describe('Méthode DEGRESSIF', () => {
    it('la somme des dotations = valeur brute', () => {
      const lignes = calculerTableauAmortissement(150000, 5, 'DEGRESSIF', new Date('2025-01-01'));
      const total = lignes.reduce((s, l) => s + l.dotation, 0);
      expect(total).toBe(150000);
    });

    it('la VNC finale est zéro', () => {
      const lignes = calculerTableauAmortissement(150000, 5, 'DEGRESSIF', new Date('2025-01-01'));
      expect(lignes[lignes.length - 1].valeurNetteComptable).toBe(0);
    });

    it('première annuité > dernière (dégressif)', () => {
      const lignes = calculerTableauAmortissement(150000, 5, 'DEGRESSIF', new Date('2025-01-01'));
      expect(lignes[0].dotation).toBeGreaterThan(lignes[lignes.length - 1].dotation);
    });
  });
});

// ── CreateImmobilisationUseCase ───────────────────────────────────────────────

describe('CreateImmobilisationUseCase', () => {
  function uc() { return new CreateImmobilisationUseCase(mockImmoRepo as any); }

  it('crée une immobilisation et retourne l\'entité', async () => {
    const result = await uc().execute({
      libelle: 'Ordi',
      dateAcquisition: new Date('2025-01-01'),
      valeurBrute: 150000,
      dureeAmortissement: 3,
      methode: 'LINEAIRE',
      compteBilanCode: '2183',
      compteAmortissementCode: '2813',
      compteChargeCode: '6811',
    }, USER_ID);

    expect(mockImmoRepo.create).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
  });

  it('lève BadRequestException si valeurBrute <= 0', async () => {
    await expect(uc().execute({
      libelle: 'x', dateAcquisition: new Date(), valeurBrute: 0, dureeAmortissement: 3,
      methode: 'LINEAIRE', compteBilanCode: '2183', compteAmortissementCode: '2813', compteChargeCode: '6811',
    }, USER_ID)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lève BadRequestException si durée < 1', async () => {
    await expect(uc().execute({
      libelle: 'x', dateAcquisition: new Date(), valeurBrute: 10000, dureeAmortissement: 0,
      methode: 'LINEAIRE', compteBilanCode: '2183', compteAmortissementCode: '2813', compteChargeCode: '6811',
    }, USER_ID)).rejects.toBeInstanceOf(BadRequestException);
  });
});

// ── FindImmobilisationsUseCase ─────────────────────────────────────────────────

describe('FindImmobilisationsUseCase', () => {
  it('retourne la liste des immobilisations', async () => {
    const result = await new FindImmobilisationsUseCase(mockImmoRepo as any).execute(USER_ID);
    expect(result).toHaveLength(1);
    expect(mockImmoRepo.findAll).toHaveBeenCalledWith(USER_ID);
  });
});

// ── GetImmobilisationUseCase ───────────────────────────────────────────────────

describe('GetImmobilisationUseCase', () => {
  function uc() { return new GetImmobilisationUseCase(mockImmoRepo as any); }

  it('retourne l\'immobilisation si trouvée', async () => {
    const result = await uc().execute(1, USER_ID);
    expect(result).toBeDefined();
  });

  it('lève NotFoundException si introuvable', async () => {
    mockImmoRepo.findById.mockResolvedValue(null);
    await expect(uc().execute(99, USER_ID)).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ── DeleteImmobilisationUseCase ────────────────────────────────────────────────

describe('DeleteImmobilisationUseCase', () => {
  function uc() { return new DeleteImmobilisationUseCase(mockImmoRepo as any); }

  it('supprime une immobilisation sans dotations comptabilisées', async () => {
    await uc().execute(1, USER_ID);
    expect(mockImmoRepo.delete).toHaveBeenCalledWith(1, USER_ID);
  });

  it('lève NotFoundException si introuvable', async () => {
    mockImmoRepo.findById.mockResolvedValue(null);
    await expect(uc().execute(99, USER_ID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève BadRequestException si une dotation est déjà comptabilisée', async () => {
    mockImmoRepo.findById.mockResolvedValue(new Immobilisation(
      'x', new Date(), 100000, 3, 'LINEAIRE', '2183', '2813', '6811', 'ACTIF',
      [new LigneAmortissement(2025, 33333, 33333, 66667, true, 1)], 1, USER_ID,
    ));
    await expect(uc().execute(1, USER_ID)).rejects.toBeInstanceOf(BadRequestException);
  });
});

// ── ComptabiliserDotationUseCase ───────────────────────────────────────────────

describe('ComptabiliserDotationUseCase', () => {
  function uc() {
    return new ComptabiliserDotationUseCase(mockImmoRepo as any, mockJeRepo as any);
  }

  it('comptabilise la dotation et retourne le journalEntryId', async () => {
    const result = await uc().execute(1, 2025, USER_ID);
    expect(result.journalEntryId).toBe(99);
    expect(mockJeRepo.createJournalEntry).toHaveBeenCalledTimes(1);
    expect(mockImmoRepo.markDotationComptabilisee).toHaveBeenCalledWith(1, 2025, 99);
  });

  it('lève NotFoundException si immobilisation introuvable', async () => {
    mockImmoRepo.findById.mockResolvedValue(null);
    await expect(uc().execute(99, 2025, USER_ID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève BadRequestException si immobilisation cédée', async () => {
    mockImmoRepo.findById.mockResolvedValue(new Immobilisation(
      'x', new Date(), 100000, 3, 'LINEAIRE', '2183', '2813', '6811', 'CEDE', [], 1, USER_ID,
    ));
    await expect(uc().execute(1, 2025, USER_ID)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lève NotFoundException si aucune ligne pour l\'exercice', async () => {
    await expect(uc().execute(1, 2099, USER_ID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève BadRequestException si dotation déjà comptabilisée', async () => {
    mockImmoRepo.findById.mockResolvedValue(new Immobilisation(
      'x', new Date(), 100000, 3, 'LINEAIRE', '2183', '2813', '6811', 'ACTIF',
      [new LigneAmortissement(2025, 50000, 50000, 50000, true, 1)], 1, USER_ID,
    ));
    await expect(uc().execute(1, 2025, USER_ID)).rejects.toBeInstanceOf(BadRequestException);
  });
});

// ── CederImmobilisationUseCase ─────────────────────────────────────────────────

describe('CederImmobilisationUseCase', () => {
  function uc() {
    return new CederImmobilisationUseCase(mockImmoRepo as any, mockJeRepo as any);
  }

  it('enregistre la cession et retourne la plus/moins-value', async () => {
    // VNC = 150000 (aucune dotation comptabilisée), prixCession = 100000 → moins-value = -50000
    const result = await uc().execute(1, new Date('2027-06-30'), 100000, USER_ID);
    expect(result.journalEntryId).toBe(99);
    expect(result.plusMoinsValue).toBe(-50000);
    expect(mockImmoRepo.setStatutCede).toHaveBeenCalled();
  });

  it('lève NotFoundException si introuvable', async () => {
    mockImmoRepo.findById.mockResolvedValue(null);
    await expect(uc().execute(99, new Date(), 0, USER_ID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève BadRequestException si déjà cédée', async () => {
    mockImmoRepo.findById.mockResolvedValue(new Immobilisation(
      'x', new Date(), 100000, 3, 'LINEAIRE', '2183', '2813', '6811', 'CEDE', [], 1, USER_ID,
    ));
    await expect(uc().execute(1, new Date(), 0, USER_ID)).rejects.toBeInstanceOf(BadRequestException);
  });
});
