import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const execFileAsync = promisify(execFile);

export interface BackupResult {
  success: boolean;
  filename?: string;
  size?: string;
  error?: string;
  timestamp: Date;
}

export interface BackupEntry {
  filename: string;
  size: number;
  createdAt: Date;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly scriptPath = process.env.BACKUP_SCRIPT_PATH ?? '/scripts/backup-db.sh';
  private readonly backupDir = process.env.BACKUP_DIR ?? '/backups';

  // Tâche planifiée : chaque nuit à 02h00 UTC (redondance par rapport au cron Docker)
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledBackup(): Promise<void> {
    this.logger.log('Démarrage de la sauvegarde planifiée...');
    const result = await this.runBackup();
    if (result.success) {
      this.logger.log(`Sauvegarde réussie : ${result.filename} (${result.size})`);
    } else {
      this.logger.error(`Échec de la sauvegarde : ${result.error}`);
    }
  }

  async runBackup(): Promise<BackupResult> {
    const timestamp = new Date();

    if (!existsSync(this.scriptPath)) {
      return {
        success: false,
        error: `Script introuvable : ${this.scriptPath}`,
        timestamp,
      };
    }

    try {
      const { stdout } = await execFileAsync('sh', [this.scriptPath], {
        env: {
          ...process.env,
          BACKUP_DIR: this.backupDir,
        },
        timeout: 5 * 60 * 1000, // 5 min max
      });

      // Extraire le nom de fichier depuis la dernière ligne "OK — /backups/xxx.sql.gz"
      const match = stdout.match(/OK — (.+\.sql\.gz)/);
      const filename = match ? match[1].split('/').pop() : undefined;
      const sizeMatch = stdout.match(/terminée — (\S+)/);
      const size = sizeMatch ? sizeMatch[1] : undefined;

      return { success: true, filename, size, timestamp };
    } catch (err: any) {
      return {
        success: false,
        error: err.stderr ?? err.message ?? 'Erreur inconnue',
        timestamp,
      };
    }
  }

  listBackups(): BackupEntry[] {
    if (!existsSync(this.backupDir)) return [];

    return readdirSync(this.backupDir)
      .filter(f => f.endsWith('.sql.gz'))
      .map(f => {
        const stat = statSync(join(this.backupDir, f));
        return { filename: f, size: stat.size, createdAt: stat.mtime };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
