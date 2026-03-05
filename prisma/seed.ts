import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Accounts
  const accounts = await Promise.all([
    prisma.account.upsert({ where: { code: '101' }, update: {}, create: { code: '101', name: 'Capital social',              class: 1 } }),
    prisma.account.upsert({ where: { code: '106' }, update: {}, create: { code: '106', name: 'Réserves légales',            class: 1 } }),
    prisma.account.upsert({ where: { code: '215' }, update: {}, create: { code: '215', name: 'Matériel informatique',       class: 2 } }),
    prisma.account.upsert({ where: { code: '218' }, update: {}, create: { code: '218', name: 'Mobilier de bureau',          class: 2 } }),
    prisma.account.upsert({ where: { code: '370' }, update: {}, create: { code: '370', name: 'Stocks de marchandises',      class: 3 } }),
    prisma.account.upsert({ where: { code: '401' }, update: {}, create: { code: '401', name: 'Fournisseurs',                class: 4 } }),
    prisma.account.upsert({ where: { code: '411' }, update: {}, create: { code: '411', name: 'Clients',                    class: 4 } }),
    prisma.account.upsert({ where: { code: '421' }, update: {}, create: { code: '421', name: 'Personnel — rémunérations',  class: 4 } }),
    prisma.account.upsert({ where: { code: '445' }, update: {}, create: { code: '445', name: 'TVA collectée',              class: 4 } }),
    prisma.account.upsert({ where: { code: '512' }, update: {}, create: { code: '512', name: 'Banque CIC',                 class: 5 } }),
    prisma.account.upsert({ where: { code: '530' }, update: {}, create: { code: '530', name: 'Caisse',                     class: 5 } }),
    prisma.account.upsert({ where: { code: '601' }, update: {}, create: { code: '601', name: 'Achats de marchandises',     class: 6 } }),
    prisma.account.upsert({ where: { code: '615' }, update: {}, create: { code: '615', name: 'Loyer et charges locatives', class: 6 } }),
    prisma.account.upsert({ where: { code: '641' }, update: {}, create: { code: '641', name: 'Salaires et traitements',    class: 6 } }),
    prisma.account.upsert({ where: { code: '616' }, update: {}, create: { code: '616', name: "Primes d'assurance",         class: 6 } }),
    prisma.account.upsert({ where: { code: '626' }, update: {}, create: { code: '626', name: 'Frais postaux et télécom.',  class: 6 } }),
    prisma.account.upsert({ where: { code: '701' }, update: {}, create: { code: '701', name: 'Ventes de produits finis',   class: 7 } }),
    prisma.account.upsert({ where: { code: '706' }, update: {}, create: { code: '706', name: 'Prestations de services',    class: 7 } }),
    prisma.account.upsert({ where: { code: '758' }, update: {}, create: { code: '758', name: 'Produits divers de gestion', class: 7 } }),
    prisma.account.upsert({ where: { code: '890' }, update: {}, create: { code: '890', name: "Bilan d'ouverture",          class: 8 } }),
  ]);

  // Map by code for easy reference
  const acc = Object.fromEntries(accounts.map(a => [a.code, a]));

  // Operations
  const ops = await Promise.all([
    prisma.operation.create({ data: { type: 'SALE',              date: new Date('2026-03-01'), label: 'Vente — Société Alpha',               amount: 1260000 } }),
    prisma.operation.create({ data: { type: 'SALARY_PAYMENT',   date: new Date('2026-02-28'), label: 'Salaires mars 2026',                  amount:  280000 } }),
    prisma.operation.create({ data: { type: 'PURCHASE',         date: new Date('2026-02-26'), label: 'Achat stock — Fournisseur Beta',       amount:  185000 } }),
    prisma.operation.create({ data: { type: 'SERVICE_EXPENSE',  date: new Date('2026-02-25'), label: 'Loyer local commercial mars 2026',     amount:  120000 } }),
    prisma.operation.create({ data: { type: 'PAYMENT',          date: new Date('2026-02-22'), label: 'Règlement facture EDF Entreprises',    amount:    8500 } }),
    prisma.operation.create({ data: { type: 'SERVICE_INCOME',   date: new Date('2026-02-20'), label: 'Prestation conseil — Client Gamma',    amount:  350000 } }),
    prisma.operation.create({ data: { type: 'LOAN_REPAYMENT',   date: new Date('2026-02-15'), label: 'Mensualité crédit équipement',         amount:   45000 } }),
    prisma.operation.create({ data: { type: 'RECEIPT',          date: new Date('2026-02-10'), label: 'Encaissement client Delta',            amount:  840000 } }),
    prisma.operation.create({ data: { type: 'SOCIAL_CONTRIBUTION', date: new Date('2026-02-08'), label: 'Cotisations URSSAF — février',     amount:   62000 } }),
    prisma.operation.create({ data: { type: 'VAT_COLLECTED',    date: new Date('2026-02-05'), label: 'TVA à reverser — janvier',             amount:  164000 } }),
  ]);

  // Journal Entries
  await prisma.journalEntry.create({
    data: {
      date: new Date('2026-03-01'), label: 'Vente Société Alpha — Facture 2026-018', operationId: ops[0].id,
      lines: { create: [
        { accountId: acc['411'].id, debit:  984000, credit:      0 },
        { accountId: acc['701'].id, debit:       0, credit: 820000 },
        { accountId: acc['445'].id, debit:       0, credit: 164000 },
      ]},
    },
  });
  await prisma.journalEntry.create({
    data: {
      date: new Date('2026-02-28'), label: 'Salaires mars 2026', operationId: ops[1].id,
      lines: { create: [
        { accountId: acc['641'].id, debit: 280000, credit:      0 },
        { accountId: acc['421'].id, debit:      0, credit: 280000 },
      ]},
    },
  });
  await prisma.journalEntry.create({
    data: {
      date: new Date('2026-02-26'), label: 'Achat stock Fournisseur Beta — FA 20240892', operationId: ops[2].id,
      lines: { create: [
        { accountId: acc['601'].id, debit: 185000, credit:      0 },
        { accountId: acc['401'].id, debit:      0, credit: 185000 },
      ]},
    },
  });
  await prisma.journalEntry.create({
    data: {
      date: new Date('2026-02-25'), label: 'Loyer bureau mars 2026', operationId: ops[3].id,
      lines: { create: [
        { accountId: acc['615'].id, debit: 120000, credit:      0 },
        { accountId: acc['512'].id, debit:      0, credit: 120000 },
      ]},
    },
  });
  await prisma.journalEntry.create({
    data: {
      date: new Date('2026-02-22'), label: 'Règlement facture EDF Entreprises', operationId: ops[4].id,
      lines: { create: [
        { accountId: acc['626'].id, debit: 8500, credit:    0 },
        { accountId: acc['512'].id, debit:    0, credit: 8500 },
      ]},
    },
  });
  await prisma.journalEntry.create({
    data: {
      date: new Date('2026-02-20'), label: 'Prestation conseil Client Gamma — Facture 2026-017', operationId: ops[5].id,
      lines: { create: [
        { accountId: acc['411'].id, debit: 174000, credit:      0 },
        { accountId: acc['706'].id, debit:      0, credit: 145000 },
        { accountId: acc['445'].id, debit:      0, credit:  29000 },
      ]},
    },
  });
  await prisma.journalEntry.create({
    data: {
      date: new Date('2026-02-15'), label: 'Mensualité crédit équipement', operationId: ops[6].id,
      lines: { create: [
        { accountId: acc['512'].id, debit:      0, credit: 62000 },
        { accountId: acc['401'].id, debit:  62000, credit:     0 },
      ]},
    },
  });
  await prisma.journalEntry.create({
    data: {
      date: new Date('2026-02-10'), label: 'Règlement client Delta — Facture 2026-014',
      lines: { create: [
        { accountId: acc['512'].id, debit: 280500, credit:      0 },
        { accountId: acc['411'].id, debit:      0, credit: 280500 },
      ]},
    },
  });

  // Evenements
  await prisma.evenement.createMany({
    data: [
      { titre: 'Loyer appartement',    categorie: 'LOYER',         montant: 35000000, dateEcheance: new Date('2026-03-05'), recurrence: 'MENSUEL',       statut: 'PAYE',       notes: 'Virement automatique le 5 du mois' },
      { titre: 'Écolage — École Primaire', categorie: 'ECOLAGE',   montant: 12000000, dateEcheance: new Date('2026-03-10'), recurrence: 'MENSUEL',       statut: 'EN_ATTENTE'  },
      { titre: 'Carburant véhicule',   categorie: 'CARBURANT',     montant:  8000000, dateEcheance: new Date('2026-03-15'), recurrence: 'MENSUEL',       statut: 'EN_ATTENTE', notes: 'Estimation mensuelle' },
      { titre: 'Épargne mensuelle',    categorie: 'EPARGNE',       montant: 20000000, dateEcheance: new Date('2026-03-01'), recurrence: 'MENSUEL',       statut: 'PAYE',       notes: 'Virement vers compte épargne' },
      { titre: 'Internet + Mobile',    categorie: 'ABONNEMENT',    montant:  4500000, dateEcheance: new Date('2026-03-20'), recurrence: 'MENSUEL',       statut: 'EN_RETARD'   },
      { titre: 'Courses alimentaires', categorie: 'ALIMENTATION',  montant: 15000000, dateEcheance: new Date('2026-03-07'), recurrence: 'MENSUEL',       statut: 'PAYE'        },
      { titre: 'Consultation médecin', categorie: 'SANTE',         montant:  3000000, dateEcheance: new Date('2026-03-25'), recurrence: 'UNIQUE',        statut: 'EN_ATTENTE', notes: 'Bilan annuel' },
      { titre: 'Assurance véhicule',   categorie: 'TRANSPORT',     montant:  9000000, dateEcheance: new Date('2026-03-30'), recurrence: 'ANNUEL',        statut: 'EN_ATTENTE', notes: 'Renouvellement annuel' },
    ],
  });

  // Objectifs
  await prisma.objectif.createMany({
    data: [
      { nom: "Fonds d'urgence",                description: '3 mois de dépenses courantes', categorie: 'SECURITE',      montantCible: 300000000,   montantActuel: 185000000, dateDebut: new Date('2026-01-01'), dateEcheance: new Date('2026-12-31'), couleur: '#1565c0', icone: 'shield',        statut: 'EN_COURS' },
      { nom: 'Achat véhicule',                 description: 'Voiture personnelle',          categorie: 'PROJET',        montantCible: 2000000000,  montantActuel: 820000000, dateDebut: new Date('2025-06-01'), dateEcheance: new Date('2027-06-01'), couleur: '#2e7d32', icone: 'directions_car', statut: 'EN_COURS' },
      { nom: 'Vacances annuelles',             description: 'Voyage famille',               categorie: 'PROJET',        montantCible:  80000000,   montantActuel:  80000000, dateDebut: new Date('2026-01-01'), dateEcheance: new Date('2026-07-01'), couleur: '#f57f17', icone: 'flight',        statut: 'ATTEINT'  },
      { nom: 'Retraite anticipée',             description: 'Capital retraite à 50 ans',    categorie: 'RETRAITE',      montantCible: 10000000000, montantActuel: 1250000000,dateDebut: new Date('2020-01-01'), dateEcheance: new Date('2040-01-01'), couleur: '#4a148c', icone: 'elderly',       statut: 'EN_COURS' },
      { nom: 'Remboursement crédit équipement',description: 'Solde restant du crédit',      categorie: 'REMBOURSEMENT', montantCible:  50000000,   montantActuel:  32000000, dateDebut: new Date('2026-01-01'), dateEcheance: new Date('2026-09-30'), couleur: '#bf360c', icone: 'credit_card',   statut: 'EN_COURS' },
    ],
  });

  // Budgets
  const b1 = await prisma.budget.create({ data: { exercice: 2026, mois: 3 } });
  await prisma.budgetLigne.createMany({ data: [
    { budgetId: b1.id, categorie: 'Ventes',     libelle: "Chiffre d'affaires",       montantPrevu: 1200000, type: 'PRODUIT' },
    { budgetId: b1.id, categorie: 'Services',   libelle: 'Prestations de services',  montantPrevu:  200000, type: 'PRODUIT' },
    { budgetId: b1.id, categorie: 'Loyer',      libelle: 'Loyer local commercial',   montantPrevu:  120000, type: 'CHARGE'  },
    { budgetId: b1.id, categorie: 'Salaires',   libelle: 'Charges de personnel',     montantPrevu:  300000, type: 'CHARGE'  },
    { budgetId: b1.id, categorie: 'Stocks',     libelle: 'Achats de marchandises',   montantPrevu:  200000, type: 'CHARGE'  },
    { budgetId: b1.id, categorie: 'Assurances', libelle: "Primes d'assurance",       montantPrevu:   25000, type: 'CHARGE'  },
    { budgetId: b1.id, categorie: 'Télécom',    libelle: 'Frais postaux/télécom',    montantPrevu:   10000, type: 'CHARGE'  },
  ]});
  const b2 = await prisma.budget.create({ data: { exercice: 2026, mois: 2 } });
  await prisma.budgetLigne.createMany({ data: [
    { budgetId: b2.id, categorie: 'Ventes',   libelle: "Chiffre d'affaires",       montantPrevu: 1100000, type: 'PRODUIT' },
    { budgetId: b2.id, categorie: 'Services', libelle: 'Prestations de services',  montantPrevu:  180000, type: 'PRODUIT' },
    { budgetId: b2.id, categorie: 'Loyer',    libelle: 'Loyer local commercial',   montantPrevu:  120000, type: 'CHARGE'  },
    { budgetId: b2.id, categorie: 'Salaires', libelle: 'Charges de personnel',     montantPrevu:  300000, type: 'CHARGE'  },
    { budgetId: b2.id, categorie: 'Stocks',   libelle: 'Achats de marchandises',   montantPrevu:  180000, type: 'CHARGE'  },
  ]});
  const b3 = await prisma.budget.create({ data: { exercice: 2026, mois: 4 } });
  await prisma.budgetLigne.createMany({ data: [
    { budgetId: b3.id, categorie: 'Ventes',    libelle: "Chiffre d'affaires",       montantPrevu: 1300000, type: 'PRODUIT' },
    { budgetId: b3.id, categorie: 'Services',  libelle: 'Prestations de services',  montantPrevu:  220000, type: 'PRODUIT' },
    { budgetId: b3.id, categorie: 'Loyer',     libelle: 'Loyer local commercial',   montantPrevu:  120000, type: 'CHARGE'  },
    { budgetId: b3.id, categorie: 'Salaires',  libelle: 'Charges de personnel',     montantPrevu:  300000, type: 'CHARGE'  },
    { budgetId: b3.id, categorie: 'Marketing', libelle: 'Publicité & communication',montantPrevu:   50000, type: 'CHARGE'  },
  ]});

  // Default admin user
  await prisma.user.upsert({
    where: { email: 'admin@volako.app' },
    update: {},
    create: {
      name: 'Admin Volako',
      email: 'admin@volako.app',
      password: createHash('sha256').update('password').digest('hex'),
    },
  });

  console.log('Seed completed ✓');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
