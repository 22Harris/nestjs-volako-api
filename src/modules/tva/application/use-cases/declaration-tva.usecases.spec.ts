import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreerDeclarationTvaUseCase } from './creer-declaration.usecase';
import { ListDeclarationsTvaUseCase } from './list-declarations.usecase';
import { GetDeclarationTvaUseCase } from './get-declaration.usecase';
import { SoumettreDeclarationTvaUseCase } from './soumettre-declaration.usecase';
import { GenererExportTvaUseCase } from './generer-export-tva.usecase';
import { generateCa3Xml } from '../utils/ca3-xml.generator';

// ─── Stubs ────────────────────────────────────────────────────────────────────

const CA3_STUB = {
  dateFrom: '2026-01-01', dateTo: '2026-03-31',
  tvaCollectee: { lignes: [{ codeTva: 'NORMAL_20', taux: 20, label: 'Taux normal 20 %', baseHt: 100000, tvaBrute: 20000 }], totalBaseHt: 100000, totalTva: 20000 },
  tvaDeductible: { surImmobilisations: 0, surAutresBiensServices: 5000, total: 5000 },
  soldeTva: 15000, tvaAPayer: 15000, creditTva: 0,
};

const DECL_STUB = {
  id: 1, periode: '2026-T1', dateDebut: new Date('2026-01-01'), dateFin: new Date('2026-03-31'),
  statut: 'BROUILLON', tvaAPayer: 15000, creditTva: 0, donnees: CA3_STUB,
  dateCreation: new Date(), dateSoumission: null, userId: 1,
};

function makePrisma(overrides: Record<string, any> = {}) {
  return {
    declarationTva: {
      create: jest.fn().mockResolvedValue(DECL_STUB),
      findMany: jest.fn().mockResolvedValue([DECL_STUB]),
      findFirst: jest.fn().mockResolvedValue(DECL_STUB),
      update: jest.fn().mockResolvedValue({ ...DECL_STUB, statut: 'SOUMISE', dateSoumission: new Date() }),
      ...overrides,
    },
  };
}

function makeTvaService() {
  return { getCa3: jest.fn().mockResolvedValue(CA3_STUB) };
}

// ─── CreerDeclarationTvaUseCase ───────────────────────────────────────────────
describe('CreerDeclarationTvaUseCase', () => {
  it('appelle getCa3 et persiste la déclaration', async () => {
    const prisma = makePrisma();
    const tva = makeTvaService();
    const uc = new CreerDeclarationTvaUseCase(prisma as any, tva as any);
    const result = await uc.execute(1, '2026-01-01', '2026-03-31', '2026-T1');
    expect(tva.getCa3).toHaveBeenCalledWith(1, '2026-01-01', '2026-03-31');
    expect(prisma.declarationTva.create).toHaveBeenCalled();
    expect(result.tvaAPayer).toBe(15000);
  });

  it('lève BadRequestException si dateFrom > dateTo', async () => {
    const prisma = makePrisma();
    const tva = makeTvaService();
    const uc = new CreerDeclarationTvaUseCase(prisma as any, tva as any);
    await expect(uc.execute(1, '2026-12-31', '2026-01-01', '2026-T4')).rejects.toBeInstanceOf(BadRequestException);
  });
});

// ─── ListDeclarationsTvaUseCase ───────────────────────────────────────────────
describe('ListDeclarationsTvaUseCase', () => {
  it('retourne la liste des déclarations', async () => {
    const prisma = makePrisma();
    const result = await new ListDeclarationsTvaUseCase(prisma as any).execute(1);
    expect(prisma.declarationTva.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 1 } }));
    expect(result).toHaveLength(1);
  });
});

// ─── GetDeclarationTvaUseCase ─────────────────────────────────────────────────
describe('GetDeclarationTvaUseCase', () => {
  it('retourne la déclaration demandée', async () => {
    const prisma = makePrisma();
    const result = await new GetDeclarationTvaUseCase(prisma as any).execute(1, 1);
    expect(result.id).toBe(1);
  });

  it('lève NotFoundException si déclaration introuvable', async () => {
    const prisma = makePrisma({ findFirst: jest.fn().mockResolvedValue(null) });
    await expect(new GetDeclarationTvaUseCase(prisma as any).execute(99, 1)).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ─── SoumettreDeclarationTvaUseCase ──────────────────────────────────────────
describe('SoumettreDeclarationTvaUseCase', () => {
  it('passe la déclaration en statut SOUMISE', async () => {
    const prisma = makePrisma();
    const result = await new SoumettreDeclarationTvaUseCase(prisma as any).execute(1, 1);
    expect(prisma.declarationTva.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ statut: 'SOUMISE' }) }),
    );
    expect(result.statut).toBe('SOUMISE');
  });

  it('lève BadRequestException si déjà SOUMISE', async () => {
    const prisma = makePrisma({
      findFirst: jest.fn().mockResolvedValue({ ...DECL_STUB, statut: 'SOUMISE' }),
    });
    await expect(new SoumettreDeclarationTvaUseCase(prisma as any).execute(1, 1)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lève NotFoundException si déclaration introuvable', async () => {
    const prisma = makePrisma({ findFirst: jest.fn().mockResolvedValue(null) });
    await expect(new SoumettreDeclarationTvaUseCase(prisma as any).execute(99, 1)).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ─── GenererExportTvaUseCase ──────────────────────────────────────────────────
describe('GenererExportTvaUseCase', () => {
  it('retourne un XML et un nom de fichier', async () => {
    const prisma = makePrisma();
    const result = await new GenererExportTvaUseCase(prisma as any).execute(1, 1);
    expect(result.xml).toContain('<?xml');
    expect(result.xml).toContain('DeclarationCA3');
    expect(result.filename).toBe('CA3_2026-T1_1.xml');
  });

  it('lève NotFoundException si déclaration introuvable', async () => {
    const prisma = makePrisma({ findFirst: jest.fn().mockResolvedValue(null) });
    await expect(new GenererExportTvaUseCase(prisma as any).execute(99, 1)).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ─── generateCa3Xml ───────────────────────────────────────────────────────────
describe('generateCa3Xml()', () => {
  it('génère un XML valide avec les montants en euros', () => {
    const xml = generateCa3Xml(CA3_STUB as any, '2026-T1', 1);
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain('<Periode>2026-T1</Periode>');
    expect(xml).toContain('baseHT="1000.00"');
    expect(xml).toContain('tvaBrute="200.00"');
    expect(xml).toContain('<TVAAPayer>150.00</TVAAPayer>');
    expect(xml).toContain('<CreditTVA>0.00</CreditTVA>');
  });

  it('échappe les caractères spéciaux XML dans le libellé', () => {
    const reportAvecAmpersand = {
      ...CA3_STUB,
      tvaCollectee: {
        ...CA3_STUB.tvaCollectee,
        lignes: [{ codeTva: 'TEST', taux: 20, label: 'Taux & spécial <test>', baseHt: 100, tvaBrute: 20 }],
      },
    };
    const xml = generateCa3Xml(reportAvecAmpersand as any, '2026-T1', 1);
    expect(xml).toContain('label="Taux &amp; spécial &lt;test&gt;"');
  });

  it('génère une ligne par taux', () => {
    const reportMultiTaux = {
      ...CA3_STUB,
      tvaCollectee: {
        lignes: [
          { codeTva: 'NORMAL_20', taux: 20, label: 'Normal 20%', baseHt: 50000, tvaBrute: 10000 },
          { codeTva: 'REDUIT_5_5', taux: 5.5, label: 'Réduit 5.5%', baseHt: 20000, tvaBrute: 1100 },
        ],
        totalBaseHt: 70000, totalTva: 11100,
      },
    };
    const xml = generateCa3Xml(reportMultiTaux as any, '2026-T1', 1);
    expect(xml).toContain('code="NORMAL_20"');
    expect(xml).toContain('code="REDUIT_5_5"');
  });
});
