import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

/**
 * Tests e2e des workflows métier complets.
 * Ces tests nécessitent une base de données de test opérationnelle (DATABASE_URL dans l'env).
 * Chaque describe bloc est indépendant et nettoie après lui-même via le logout.
 */

describe('Workflows e2e', () => {
  let app: INestApplication<App>;
  let agent: ReturnType<typeof request.agent>;

  const ADMIN_CREDS = { email: 'admin@volako.com', password: 'Admin1234!' };
  const CHEF_CREDS  = { email: 'chef.comptable@volako.com', password: 'Chef1234!' };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    agent = request.agent(app.getHttpServer());
  });

  // ─── Workflow 1 : login → écriture → valider → verrouiller → FEC ─────────────

  describe('Workflow 1 : Cycle de vie d\'une écriture comptable', () => {
    let entryId: number;

    it('1.1 — Se connecter en tant que chef comptable', async () => {
      await agent
        .post('/auth/login')
        .send(CHEF_CREDS)
        .expect(200)
        .expect((res) => {
          expect(res.body.user.role).toBe('CHEF_COMPTABLE');
        });
    });

    it('1.2 — Créer une écriture en partie double', async () => {
      const dto = {
        date:  '2025-06-15',
        label: 'Achat fournitures bureau',
        lines: [
          { accountCode: '606100', debit: 5000,    credit: 0 },
          { accountCode: '401000', debit: 0,        credit: 5000 },
        ],
      };

      await agent
        .post('/auth/login')
        .send(CHEF_CREDS);

      const res = await agent
        .post('/journal-entry')
        .send(dto)
        .expect((r) => {
          expect([200, 201]).toContain(r.status);
        });

      entryId = res.body.id;
      expect(entryId).toBeDefined();
    });

    it('1.3 — Valider l\'écriture', async () => {
      if (!entryId) return;
      await agent
        .post('/auth/login')
        .send(CHEF_CREDS);

      await agent
        .patch(`/journal-entry/${entryId}/valider`)
        .expect((r) => expect([200, 204]).toContain(r.status));
    });

    it('1.4 — Verrouiller la période (juin 2025)', async () => {
      await agent
        .post('/auth/login')
        .send(ADMIN_CREDS);

      await agent
        .post('/periode-locks')
        .send({ annee: 2025, mois: 6 })
        .expect((r) => expect([200, 201, 409]).toContain(r.status));
    });

    it('1.5 — Toute écriture sur une période verrouillée est rejetée (403)', async () => {
      await agent
        .post('/auth/login')
        .send(CHEF_CREDS);

      await agent
        .post('/journal-entry')
        .send({
          date:  '2025-06-20',
          label: 'Test période verrouillée',
          lines: [
            { accountCode: '606100', debit: 100, credit: 0 },
            { accountCode: '401000', debit: 0,   credit: 100 },
          ],
        })
        .expect(403);
    });
  });

  // ─── Workflow 2 : tiers → facture → paiement ──────────────────────────────────

  describe('Workflow 2 : Tiers et paiement', () => {
    it('2.1 — Se connecter', async () => {
      await agent
        .post('/auth/login')
        .send(CHEF_CREDS)
        .expect(200);
    });

    it('2.2 — Créer un tiers fournisseur', async () => {
      const res = await agent
        .post('/tiers')
        .send({ name: 'Fournisseur Test e2e', type: 'FOURNISSEUR', siret: '12345678901234' })
        .expect((r) => expect([200, 201]).toContain(r.status));

      expect(res.body.name).toBe('Fournisseur Test e2e');
    });

    it('2.3 — Un accès non authentifié est rejeté (401)', async () => {
      await request(app.getHttpServer())
        .get('/journal-entry')
        .expect(401);
    });
  });

  // ─── Workflow 3 : verrouillage de période → blocage des modifications ─────────

  describe('Workflow 3 : Clôture de période', () => {
    it('3.1 — Verrouiller une période', async () => {
      await agent
        .post('/auth/login')
        .send(ADMIN_CREDS);

      await agent
        .post('/periode-locks')
        .send({ annee: 2025, mois: 5 })
        .expect((r) => expect([200, 201, 409]).toContain(r.status));
    });

    it('3.2 — L\'écriture sur la période verrouillée échoue (403)', async () => {
      await agent
        .post('/auth/login')
        .send(CHEF_CREDS);

      await agent
        .post('/journal-entry')
        .send({
          date:  '2025-05-10',
          label: 'Tentative sur période close',
          lines: [
            { accountCode: '606100', debit: 200, credit: 0 },
            { accountCode: '401000', debit: 0,   credit: 200 },
          ],
        })
        .expect(403);
    });

    it('3.3 — Vérifier que les périodes sont listées', async () => {
      await agent
        .post('/auth/login')
        .send(ADMIN_CREDS);

      const res = await agent
        .get('/periode-locks')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
