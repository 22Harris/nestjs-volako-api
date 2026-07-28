import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ExporterDonneesPersonnellesUseCase } from './exporter-donnees.usecase';
import { AnonymiserUtilisateurUseCase } from './anonymiser-utilisateur.usecase';
import { CreerDemandeRgpdUseCase } from './creer-demande-rgpd.usecase';
import { ListDemandesRgpdUseCase } from './list-demandes-rgpd.usecase';
import { TraiterDemandeRgpdUseCase } from './traiter-demande-rgpd.usecase';
import { PurgerAuditLogsUseCase } from './purger-audit-logs.usecase';

// ─── Stubs ────────────────────────────────────────────────────────────────────

const USER_STUB = { id: 1, name: 'Alice', email: 'alice@test.com', role: 'COMPTABLE', isActive: true };
const DEMANDE_STUB = { id: 1, userId: 1, type: 'ACCES', statut: 'EN_ATTENTE', dateCreation: new Date(), note: null };

function makePrisma(overrides: Record<string, any> = {}) {
  return {
    user: {
      findUnique: jest.fn().mockResolvedValue(USER_STUB),
      update: jest.fn().mockResolvedValue({ ...USER_STUB, isActive: false }),
    },
    tiers: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    facture: { findMany: jest.fn().mockResolvedValue([]) },
    operation: { findMany: jest.fn().mockResolvedValue([]) },
    immobilisation: { findMany: jest.fn().mockResolvedValue([]) },
    companyInfo: { findUnique: jest.fn().mockResolvedValue(null) },
    relance: { findMany: jest.fn().mockResolvedValue([]) },
    centreAnalytique: { findMany: jest.fn().mockResolvedValue([]) },
    refreshToken: { deleteMany: jest.fn().mockResolvedValue({ count: 2 }) },
    demandeRgpd: {
      create: jest.fn().mockResolvedValue(DEMANDE_STUB),
      findMany: jest.fn().mockResolvedValue([DEMANDE_STUB]),
      findUnique: jest.fn().mockResolvedValue(DEMANDE_STUB),
      update: jest.fn().mockResolvedValue({ ...DEMANDE_STUB, statut: 'TRAITEE' }),
    },
    auditLog: { deleteMany: jest.fn().mockResolvedValue({ count: 42 }) },
    $transaction: jest.fn().mockImplementation((ops: any[]) => Promise.all(ops)),
    ...overrides,
  };
}

// ─── ExporterDonneesPersonnellesUseCase ───────────────────────────────────────
describe('ExporterDonneesPersonnellesUseCase', () => {
  it('retourne une structure complète avec le profil et les données', async () => {
    const prisma = makePrisma();
    const result = await new ExporterDonneesPersonnellesUseCase(prisma as any).execute(1);
    expect(result.userId).toBe(1);
    expect(result.profil).toEqual(USER_STUB);
    expect(result.exportDate).toBeDefined();
    expect(Array.isArray(result.tiers)).toBe(true);
    expect(Array.isArray(result.factures)).toBe(true);
    expect(Array.isArray(result.operations)).toBe(true);
  });

  it('lève NotFoundException si l\'utilisateur est introuvable', async () => {
    const prisma = makePrisma({ user: { findUnique: jest.fn().mockResolvedValue(null) } });
    await expect(new ExporterDonneesPersonnellesUseCase(prisma as any).execute(99))
      .rejects.toBeInstanceOf(NotFoundException);
  });
});

// ─── AnonymiserUtilisateurUseCase ─────────────────────────────────────────────
describe('AnonymiserUtilisateurUseCase', () => {
  it('anonymise un utilisateur et révoque ses tokens', async () => {
    const prisma = makePrisma();
    const result = await new AnonymiserUtilisateurUseCase(prisma as any).execute(2, 1);
    expect(result.message).toContain('anonymisé');
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('lève NotFoundException si l\'utilisateur cible est introuvable', async () => {
    const prisma = makePrisma({ user: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() } });
    await expect(new AnonymiserUtilisateurUseCase(prisma as any).execute(99, 1))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève ForbiddenException si l\'admin essaie de s\'auto-anonymiser', async () => {
    const prisma = makePrisma();
    await expect(new AnonymiserUtilisateurUseCase(prisma as any).execute(1, 1))
      .rejects.toBeInstanceOf(ForbiddenException);
  });
});

// ─── CreerDemandeRgpdUseCase ──────────────────────────────────────────────────
describe('CreerDemandeRgpdUseCase', () => {
  it('crée une demande ACCES', async () => {
    const prisma = makePrisma();
    const result = await new CreerDemandeRgpdUseCase(prisma as any).execute(1, 'ACCES', 'Je veux mes données');
    expect(prisma.demandeRgpd.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'ACCES', userId: 1 }) }),
    );
    expect(result.statut).toBe('EN_ATTENTE');
  });

  it('crée une demande sans note', async () => {
    const prisma = makePrisma();
    await new CreerDemandeRgpdUseCase(prisma as any).execute(1, 'EFFACEMENT');
    expect(prisma.demandeRgpd.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ note: null }) }),
    );
  });
});

// ─── ListDemandesRgpdUseCase ──────────────────────────────────────────────────
describe('ListDemandesRgpdUseCase', () => {
  it('filtre par userId si fourni', async () => {
    const prisma = makePrisma();
    await new ListDemandesRgpdUseCase(prisma as any).execute(1);
    expect(prisma.demandeRgpd.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 1 } }),
    );
  });

  it('ne filtre pas si userId est undefined (vue ADMIN)', async () => {
    const prisma = makePrisma();
    await new ListDemandesRgpdUseCase(prisma as any).execute(undefined);
    expect(prisma.demandeRgpd.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });
});

// ─── TraiterDemandeRgpdUseCase ────────────────────────────────────────────────
describe('TraiterDemandeRgpdUseCase', () => {
  it('passe la demande en TRAITEE', async () => {
    const prisma = makePrisma();
    const result = await new TraiterDemandeRgpdUseCase(prisma as any).execute(1, 'TRAITEE');
    expect(prisma.demandeRgpd.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ statut: 'TRAITEE' }) }),
    );
    expect(result.statut).toBe('TRAITEE');
  });

  it('lève NotFoundException si demande introuvable', async () => {
    const prisma = makePrisma({ demandeRgpd: { ...makePrisma().demandeRgpd, findUnique: jest.fn().mockResolvedValue(null) } });
    await expect(new TraiterDemandeRgpdUseCase(prisma as any).execute(99, 'TRAITEE'))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève BadRequestException si demande déjà traitée', async () => {
    const prisma = makePrisma({
      demandeRgpd: { ...makePrisma().demandeRgpd, findUnique: jest.fn().mockResolvedValue({ ...DEMANDE_STUB, statut: 'TRAITEE' }) },
    });
    await expect(new TraiterDemandeRgpdUseCase(prisma as any).execute(1, 'REFUSEE'))
      .rejects.toBeInstanceOf(BadRequestException);
  });
});

// ─── PurgerAuditLogsUseCase ───────────────────────────────────────────────────
describe('PurgerAuditLogsUseCase', () => {
  it('purge les logs et retourne le compte supprimé', async () => {
    const prisma = makePrisma();
    const result = await new PurgerAuditLogsUseCase(prisma as any).execute(365);
    expect(result.deleted).toBe(42);
    expect(prisma.auditLog.deleteMany).toHaveBeenCalled();
  });

  it('lève BadRequestException si olderThanDays < 90', async () => {
    const prisma = makePrisma();
    await expect(new PurgerAuditLogsUseCase(prisma as any).execute(30))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepte exactement 90 jours (limite minimale)', async () => {
    const prisma = makePrisma();
    const result = await new PurgerAuditLogsUseCase(prisma as any).execute(90);
    expect(result.deleted).toBe(42);
  });
});
