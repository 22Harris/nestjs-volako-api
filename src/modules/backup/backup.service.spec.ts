import { BackupService } from './backup.service';

// Mock node modules avant toute importation du service
jest.mock('node:child_process', () => ({
  execFile: jest.fn(),
}));
jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
}));

import { execFile } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';

jest.mock('node:util', () => ({
  promisify: jest.fn((fn: any) => fn),
}));

const mockExecFile = execFile as jest.MockedFunction<typeof execFile>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockReaddirSync = readdirSync as jest.MockedFunction<typeof readdirSync>;
const mockStatSync = statSync as jest.MockedFunction<typeof statSync>;

function buildService(): BackupService {
  const svc = new BackupService();
  (svc as any).scriptPath = '/scripts/backup-db.sh';
  (svc as any).backupDir = '/backups';
  return svc;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('BackupService', () => {
  describe('runBackup()', () => {
    it('retourne success:true avec le nom du fichier si le script réussit', async () => {
      mockExistsSync.mockReturnValue(true);
      (mockExecFile as unknown as jest.Mock).mockResolvedValue({
        stdout: '[2026-05-19 02:00:01] OK — /backups/volako_prod_20260519_020001.sql.gz',
        stderr: '',
      } as any);

      const result = await buildService().runBackup();

      expect(result.success).toBe(true);
      expect(result.filename).toBe('volako_prod_20260519_020001.sql.gz');
    });

    it('retourne success:false si le script est introuvable', async () => {
      mockExistsSync.mockReturnValue(false);

      const result = await buildService().runBackup();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Script introuvable');
      expect(mockExecFile).not.toHaveBeenCalled();
    });

    it('retourne success:false si execFile rejette', async () => {
      mockExistsSync.mockReturnValue(true);
      (mockExecFile as unknown as jest.Mock).mockRejectedValue({ stderr: 'pg_dump: erreur de connexion' });

      const result = await buildService().runBackup();

      expect(result.success).toBe(false);
      expect(result.error).toBe('pg_dump: erreur de connexion');
    });

    it('extrait la taille depuis la sortie du script', async () => {
      mockExistsSync.mockReturnValue(true);
      (mockExecFile as unknown as jest.Mock).mockResolvedValue({
        stdout: [
          '[2026-05-19 02:00:00] Démarrage de la sauvegarde → /backups/db_20260519.sql.gz',
          '[2026-05-19 02:00:03] Sauvegarde terminée — 4.2M',
          '[2026-05-19 02:00:03] OK — /backups/db_20260519.sql.gz',
        ].join('\n'),
        stderr: '',
      } as any);

      const result = await buildService().runBackup();
      expect(result.size).toBe('4.2M');
    });
  });

  describe('listBackups()', () => {
    it('retourne une liste vide si le répertoire n\'existe pas', () => {
      mockExistsSync.mockReturnValue(false);
      expect(buildService().listBackups()).toEqual([]);
    });

    it('retourne les fichiers .sql.gz triés du plus récent au plus ancien', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['db_20260518.sql.gz', 'db_20260519.sql.gz'] as any);
      mockStatSync
        .mockReturnValueOnce({ size: 1000, mtime: new Date('2026-05-18') } as any)
        .mockReturnValueOnce({ size: 2000, mtime: new Date('2026-05-19') } as any);

      const list = buildService().listBackups();

      expect(list).toHaveLength(2);
      expect(list[0].filename).toBe('db_20260519.sql.gz'); // plus récent en premier
      expect(list[1].filename).toBe('db_20260518.sql.gz');
    });

    it('ignore les fichiers qui ne sont pas .sql.gz', () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(['db.sql.gz', 'README.md', 'db.tar'] as any);
      mockStatSync.mockReturnValue({ size: 500, mtime: new Date() } as any);

      const list = buildService().listBackups();
      expect(list).toHaveLength(1);
      expect(list[0].filename).toBe('db.sql.gz');
    });
  });
});
