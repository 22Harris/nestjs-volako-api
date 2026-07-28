import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PCG_DATA } from './pcg-data';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedPcg(userId: number): Promise<void> {
  await prisma.account.createMany({
    data: PCG_DATA.map((entry) => ({
      code: entry.code,
      name: entry.name,
      class: entry.class,
      userId,
      isSystem: true,
    })),
    skipDuplicates: true,
  });
}

async function main() {
  // Utilisateurs de test — un par rôle
  const testUsers = [
    { name: 'Admin',          email: 'admin@volako.com',          password: 'Admin1234!',      role: 'ADMIN'          },
    { name: 'DAF',            email: 'daf@volako.com',            password: 'Daf1234!',        role: 'DAF'            },
    { name: 'Chef Comptable', email: 'chef.comptable@volako.com', password: 'Chef1234!',       role: 'CHEF_COMPTABLE' },
    { name: 'Comptable',      email: 'comptable@volako.com',      password: 'Compta1234!',     role: 'COMPTABLE'      },
    { name: 'Assistant',      email: 'assistant@volako.com',      password: 'Assistant1234!',  role: 'ASSISTANT'      },
    { name: 'Auditeur',       email: 'auditeur@volako.com',       password: 'Audit1234!',      role: 'AUDITEUR'       },
  ] as const;

  for (const u of testUsers) {
    const hashed = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where:  { email: u.email },
      update: { role: u.role, isActive: true },
      create: { name: u.name, email: u.email, password: hashed, role: u.role, isActive: true },
    });
    await seedPcg(user.id);
  }
  console.log('Utilisateurs de test créés ✓');

  // Utilisateur de démonstration
  const seedUser = await prisma.user.upsert({
    where:  { email: 'seed@volako.app' },
    update: {},
    create: {
      name:     'Seed User',
      email:    'seed@volako.app',
      password: process.env.SEED_PASSWORD ?? 'change-me',
    },
  });
  await seedPcg(seedUser.id);
  console.log('Utilisateur seed créé ✓');

  console.log(`PCG complet (${PCG_DATA.length} comptes) appliqué à tous les utilisateurs ✓`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
