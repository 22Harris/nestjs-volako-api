import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Ensure seed user exists
  const seedUser = await prisma.user.upsert({
    where: { email: 'seed@volako.app' },
    update: {},
    create: {
      name: 'Seed User',
      email: 'seed@volako.app',
      password: process.env.SEED_PASSWORD ?? 'change-me',
    },
  });
  const seedUserId = seedUser.id;

  // Plan Comptable Général (PCG) — seeded for seed user
  await Promise.all([
    // Classe 1 — Capitaux
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '101'   } }, update: {}, create: { code: '101',   name: 'Capital social',                        class: 1, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '106'   } }, update: {}, create: { code: '106',   name: 'Réserves légales',                      class: 1, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '164'   } }, update: {}, create: { code: '164',   name: 'Emprunts et dettes financières',         class: 1, userId: seedUserId } }),
    // Classe 2 — Immobilisations
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '21'    } }, update: {}, create: { code: '21',    name: 'Immobilisations corporelles',            class: 2, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '215'   } }, update: {}, create: { code: '215',   name: 'Matériel informatique',                 class: 2, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '218'   } }, update: {}, create: { code: '218',   name: 'Mobilier de bureau',                    class: 2, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '273'   } }, update: {}, create: { code: '273',   name: 'Prêts et avances à long terme',         class: 2, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '28'    } }, update: {}, create: { code: '28',    name: 'Amortissements des immobilisations',    class: 2, userId: seedUserId } }),
    // Classe 3 — Stocks
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '370'   } }, update: {}, create: { code: '370',   name: 'Stocks de marchandises',                class: 3, userId: seedUserId } }),
    // Classe 4 — Tiers
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '401'   } }, update: {}, create: { code: '401',   name: 'Fournisseurs',                          class: 4, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '411'   } }, update: {}, create: { code: '411',   name: 'Clients',                               class: 4, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '421'   } }, update: {}, create: { code: '421',   name: 'Personnel — rémunérations',             class: 4, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '445'   } }, update: {}, create: { code: '445',   name: 'État — impôts et taxes',                class: 4, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '44566' } }, update: {}, create: { code: '44566', name: 'TVA déductible',                        class: 4, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '44571' } }, update: {}, create: { code: '44571', name: 'TVA collectée',                         class: 4, userId: seedUserId } }),
    // Classe 5 — Financiers
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '512'   } }, update: {}, create: { code: '512',   name: 'Banque',                                class: 5, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '530'   } }, update: {}, create: { code: '530',   name: 'Caisse',                                class: 5, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '531'   } }, update: {}, create: { code: '531',   name: 'Caisse (espèces)',                       class: 5, userId: seedUserId } }),
    // Classe 6 — Charges
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '601'   } }, update: {}, create: { code: '601',   name: 'Achats de marchandises',                class: 6, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '606'   } }, update: {}, create: { code: '606',   name: 'Achats non stockés',                    class: 6, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '615'   } }, update: {}, create: { code: '615',   name: 'Loyer et charges locatives',            class: 6, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '616'   } }, update: {}, create: { code: '616',   name: "Primes d'assurance",                    class: 6, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '626'   } }, update: {}, create: { code: '626',   name: 'Frais postaux et télécom.',             class: 6, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '641'   } }, update: {}, create: { code: '641',   name: 'Salaires et traitements',               class: 6, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '645'   } }, update: {}, create: { code: '645',   name: 'Charges sociales',                      class: 6, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '658'   } }, update: {}, create: { code: '658',   name: 'Charges exceptionnelles de gestion',    class: 6, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '67'    } }, update: {}, create: { code: '67',    name: 'Charges exceptionnelles',               class: 6, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '671'   } }, update: {}, create: { code: '671',   name: 'Charges exceptionnelles — amendes',     class: 6, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '6811'  } }, update: {}, create: { code: '6811',  name: 'Dotations aux amortissements',          class: 6, userId: seedUserId } }),
    // Classe 7 — Produits
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '701'   } }, update: {}, create: { code: '701',   name: 'Ventes de produits finis',              class: 7, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '706'   } }, update: {}, create: { code: '706',   name: 'Prestations de services',               class: 7, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '707'   } }, update: {}, create: { code: '707',   name: 'Ventes de marchandises',                class: 7, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '74'    } }, update: {}, create: { code: '74',    name: "Subventions d'exploitation",            class: 7, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '758'   } }, update: {}, create: { code: '758',   name: 'Produits exceptionnels de gestion',     class: 7, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '775'   } }, update: {}, create: { code: '775',   name: "Produits de cession d'immobilisations", class: 7, userId: seedUserId } }),
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '77'    } }, update: {}, create: { code: '77',    name: 'Produits exceptionnels',                class: 7, userId: seedUserId } }),
    // Classe 8 — Spéciaux
    prisma.account.upsert({ where: { userId_code: { userId: seedUserId, code: '890'   } }, update: {}, create: { code: '890',   name: "Bilan d'ouverture",                     class: 8, userId: seedUserId } }),
  ]);

  console.log('Seed completed ✓');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
