import { BadRequestException, NotFoundException } from '@nestjs/common';
import { generateFacturXXml } from '../utils/facturx.generator';
import { GenerateFacturXUseCase } from './generate-facturx.usecase';
import { Facture } from '../../domain/entities/facture.entity';
import { CompanyInfo } from 'src/modules/company-info/domain/entities/company-info.entity';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeSeller(): CompanyInfo {
  return new CompanyInfo(
    'SARL Volako',
    1, 1,
    '12345678901234',
    'FR12345678901',
    '12 rue de la Paix, 75001 Paris',
    'contact@volako.fr',
    'FR76 3000 4000 0300 0000 0003 43',
  );
}

function makeFacture(overrides: Partial<Facture> = {}): Facture {
  return new Facture(
    'FACT-2025-0001',
    new Date('2025-06-01'),
    120000,        // 1 200,00 € TTC
    'EN_ATTENTE',
    1,
    42,
    new Date('2025-07-01'),
    'Prestation de conseil',
    'Client XYZ',
    'CLIENT',
    [],
    0,
    120000,
  );
}

// ─── Mocks ─────────────────────────────────────────────────────────────────────

const mockFactureRepo = { findById: jest.fn() };
const mockCompanyRepo = { findByUser: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  mockFactureRepo.findById.mockResolvedValue(makeFacture());
  mockCompanyRepo.findByUser.mockResolvedValue(makeSeller());
});

// ── generateFacturXXml (pur) ───────────────────────────────────────────────────

describe('generateFacturXXml', () => {
  const facture = makeFacture();
  const seller = makeSeller();

  it('génère un XML valide contenant le numéro de facture', () => {
    const xml = generateFacturXXml(facture, seller);
    expect(xml).toContain('FACT-2025-0001');
  });

  it('contient le profil MINIMUM par défaut', () => {
    const xml = generateFacturXXml(facture, seller);
    expect(xml).toContain('urn:factur-x.eu:1p0:minimum');
  });

  it('contient le profil EN_16931 si demandé', () => {
    const xml = generateFacturXXml(facture, seller, { profile: 'EN_16931' });
    expect(xml).toContain('urn:cen.eu:en16931:2017');
  });

  it('contient le nom du vendeur', () => {
    const xml = generateFacturXXml(facture, seller);
    expect(xml).toContain('SARL Volako');
  });

  it('contient le nom du client', () => {
    const xml = generateFacturXXml(facture, seller);
    expect(xml).toContain('Client XYZ');
  });

  it('contient le SIRET du vendeur', () => {
    const xml = generateFacturXXml(facture, seller);
    expect(xml).toContain('12345678901234');
  });

  it('contient le numéro de TVA intracommunautaire', () => {
    const xml = generateFacturXXml(facture, seller);
    expect(xml).toContain('FR12345678901');
  });

  it('contient l\'IBAN du vendeur (espaces supprimés)', () => {
    const xml = generateFacturXXml(facture, seller);
    expect(xml).toContain('FR763000400003000000000343');
  });

  it('calcule correctement les montants HT + TVA avec taux 20%', () => {
    const xml = generateFacturXXml(facture, seller, { tauxTva: 20 });
    // montantTtc = 120000 → HT = 100000 → TVA = 20000
    expect(xml).toContain('1000.00'); // HT
    expect(xml).toContain('200.00');  // TVA
    expect(xml).toContain('1200.00'); // TTC
  });

  it('génère sans TVA si tauxTva = 0', () => {
    const xml = generateFacturXXml(facture, seller, { tauxTva: 0 });
    expect(xml).not.toContain('<ram:ApplicableTradeTax>');
    expect(xml).toContain('1200.00'); // montant brut = TTC
  });

  it('contient la date d\'échéance', () => {
    const xml = generateFacturXXml(facture, seller);
    expect(xml).toContain('20250701');
  });

  it('contient les notes si présentes', () => {
    const xml = generateFacturXXml(facture, seller);
    expect(xml).toContain('Prestation de conseil');
  });

  it('échappe les caractères XML spéciaux dans le nom', () => {
    const sellerEsc = new CompanyInfo('SARL & Associés', 1, 1);
    const xml = generateFacturXXml(makeFacture(), sellerEsc);
    expect(xml).toContain('SARL &amp; Associ');
  });

  it('produit un XML commençant par la déclaration XML', () => {
    const xml = generateFacturXXml(facture, seller);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });
});

// ── GenerateFacturXUseCase ─────────────────────────────────────────────────────

describe('GenerateFacturXUseCase', () => {
  function uc() {
    return new GenerateFacturXUseCase(mockFactureRepo as any, mockCompanyRepo as any);
  }

  it('retourne le XML Factur-X pour une facture existante', async () => {
    const xml = await uc().execute(42, 1);
    expect(xml).toContain('FACT-2025-0001');
    expect(xml).toContain('SARL Volako');
  });

  it('lève NotFoundException si la facture n\'existe pas', async () => {
    mockFactureRepo.findById.mockResolvedValue(null);
    await expect(uc().execute(99, 1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève BadRequestException si les infos société ne sont pas configurées', async () => {
    mockCompanyRepo.findByUser.mockResolvedValue(null);
    await expect(uc().execute(42, 1)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('transmet les options de profil et de TVA au générateur', async () => {
    const xml = await uc().execute(42, 1, { profile: 'BASIC_WL', tauxTva: 10 });
    expect(xml).toContain('urn:factur-x.eu:1p0:basicwl');
  });
});
