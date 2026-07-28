import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeleteJournalEntryUseCase } from './delete-journal-entry.usecase';
import { FindJournalEntriesUseCase } from './find-journal-entries.usecase';
import { ValiderJournalEntryUseCase } from './valider-journal-entry.usecase';
import { RejeterJournalEntryUseCase } from './rejeter-journal-entry.usecase';
import { VerrouillerJournalEntryUseCase } from './verrouiller-journal-entry.usecase';
import { UpdateLabelOfJournalEntryUseCase } from './update-label-of-journal-entry.usecase';
import { LettrerLignesUseCase } from './lettrer-lignes.usecase';
import { DelettrerLignesUseCase } from './delettrer-lignes.usecase';
import { GetJournalEntryByIdUseCase } from './get-journal-entry-by-id.usecase';
import { Role } from 'src/common/enums/role.enum';

const mockRepo = {
  getEntryMeta: jest.fn(),
  deleteJournalEntry: jest.fn(),
  findJournalEntries: jest.fn(),
  updateStatut: jest.fn(),
  updateLabelOfJournalEntry: jest.fn(),
  lettrerLignes: jest.fn(),
  deletterLignes: jest.fn(),
  getJournalById: jest.fn(),
};

const mockPeriodeLocks = { isLocked: jest.fn() };
const mockAuditLog = { log: jest.fn() };
const mockCache = { del: jest.fn() };

const USER_ID = 1;

function makeMeta(statut = 'BROUILLON', userId = USER_ID) {
  return { id: 10, statut, userId, date: new Date('2025-06-15') } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuditLog.log.mockResolvedValue(undefined);
  mockPeriodeLocks.isLocked.mockResolvedValue(false);
  mockCache.del.mockResolvedValue(undefined);
});

// ── DeleteJournalEntryUseCase ──────────────────────────────────────────────────

describe('DeleteJournalEntryUseCase', () => {
  function uc() {
    return new DeleteJournalEntryUseCase(mockRepo as any, mockPeriodeLocks as any);
  }

  it('supprime une écriture BROUILLON', async () => {
    mockRepo.getEntryMeta.mockResolvedValue(makeMeta('BROUILLON'));
    mockRepo.deleteJournalEntry.mockResolvedValue(undefined);

    await uc().execute(10, USER_ID, Role.DAF);
    expect(mockRepo.deleteJournalEntry).toHaveBeenCalledWith(10, USER_ID);
  });

  it('lève NotFoundException si introuvable', async () => {
    mockRepo.getEntryMeta.mockResolvedValue(null);
    await expect(uc().execute(99, USER_ID, Role.DAF)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève ForbiddenException pour écriture VERROUILLE', async () => {
    mockRepo.getEntryMeta.mockResolvedValue(makeMeta('VERROUILLE'));
    await expect(uc().execute(10, USER_ID, Role.DAF)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lève ForbiddenException si période verrouillée', async () => {
    mockRepo.getEntryMeta.mockResolvedValue(makeMeta('BROUILLON'));
    mockPeriodeLocks.isLocked.mockResolvedValue(true);
    await expect(uc().execute(10, USER_ID, Role.DAF)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lève ForbiddenException si ASSISTANT tente de supprimer une écriture d\'un autre', async () => {
    mockRepo.getEntryMeta.mockResolvedValue(makeMeta('BROUILLON', 99));
    await expect(uc().execute(10, USER_ID, Role.ASSISTANT)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lève ForbiddenException si ASSISTANT tente de supprimer une écriture non BROUILLON', async () => {
    mockRepo.getEntryMeta.mockResolvedValue(makeMeta('VALIDE', USER_ID));
    await expect(uc().execute(10, USER_ID, Role.ASSISTANT)).rejects.toBeInstanceOf(ForbiddenException);
  });
});

// ── FindJournalEntriesUseCase ──────────────────────────────────────────────────

describe('FindJournalEntriesUseCase', () => {
  it('retourne les écritures paginées', async () => {
    const page = { data: [], total: 0, page: 1, pageSize: 50, totalPages: 0 };
    mockRepo.findJournalEntries.mockResolvedValue(page);

    const result = await new FindJournalEntriesUseCase(mockRepo as any).execute(USER_ID, undefined, undefined, 1, 50);
    expect(result).toBe(page);
    expect(mockRepo.findJournalEntries).toHaveBeenCalledWith(USER_ID, undefined, undefined, 1, 50);
  });
});

// ── ValiderJournalEntryUseCase ─────────────────────────────────────────────────

describe('ValiderJournalEntryUseCase', () => {
  function uc() {
    return new ValiderJournalEntryUseCase(mockRepo as any, mockAuditLog as any, mockCache as any);
  }

  it('valide une écriture BROUILLON', async () => {
    mockRepo.getEntryMeta.mockResolvedValue(makeMeta('BROUILLON'));
    mockRepo.updateStatut.mockResolvedValue(undefined);

    await uc().execute(10, USER_ID);
    expect(mockRepo.updateStatut).toHaveBeenCalledWith(10, 'VALIDE');
    expect(mockCache.del).toHaveBeenCalledWith(`balance:${USER_ID}`);
  });

  it('lève NotFoundException si introuvable', async () => {
    mockRepo.getEntryMeta.mockResolvedValue(null);
    await expect(uc().execute(99, USER_ID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève BadRequestException si déjà VALIDE', async () => {
    mockRepo.getEntryMeta.mockResolvedValue(makeMeta('VALIDE'));
    await expect(uc().execute(10, USER_ID)).rejects.toBeInstanceOf(BadRequestException);
  });
});

// ── RejeterJournalEntryUseCase ─────────────────────────────────────────────────

describe('RejeterJournalEntryUseCase', () => {
  function uc() {
    return new RejeterJournalEntryUseCase(mockRepo as any, mockAuditLog as any);
  }

  it('rejette une écriture VALIDE', async () => {
    mockRepo.getEntryMeta.mockResolvedValue(makeMeta('VALIDE'));
    mockRepo.updateStatut.mockResolvedValue(undefined);

    await uc().execute(10, USER_ID);
    expect(mockRepo.updateStatut).toHaveBeenCalledWith(10, 'BROUILLON');
  });

  it('lève NotFoundException si introuvable', async () => {
    mockRepo.getEntryMeta.mockResolvedValue(null);
    await expect(uc().execute(99, USER_ID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève BadRequestException si écriture non VALIDE', async () => {
    mockRepo.getEntryMeta.mockResolvedValue(makeMeta('BROUILLON'));
    await expect(uc().execute(10, USER_ID)).rejects.toBeInstanceOf(BadRequestException);
  });
});

// ── VerrouillerJournalEntryUseCase ─────────────────────────────────────────────

describe('VerrouillerJournalEntryUseCase', () => {
  function uc() {
    return new VerrouillerJournalEntryUseCase(mockRepo as any, mockAuditLog as any);
  }

  it('verrouille une écriture VALIDE', async () => {
    mockRepo.getEntryMeta.mockResolvedValue(makeMeta('VALIDE'));
    mockRepo.updateStatut.mockResolvedValue(undefined);

    await uc().execute(10, USER_ID);
    expect(mockRepo.updateStatut).toHaveBeenCalledWith(10, 'VERROUILLE');
  });

  it('lève NotFoundException si introuvable', async () => {
    mockRepo.getEntryMeta.mockResolvedValue(null);
    await expect(uc().execute(99, USER_ID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève BadRequestException si écriture non VALIDE', async () => {
    mockRepo.getEntryMeta.mockResolvedValue(makeMeta('BROUILLON'));
    await expect(uc().execute(10, USER_ID)).rejects.toBeInstanceOf(BadRequestException);
  });
});

// ── UpdateLabelOfJournalEntryUseCase ───────────────────────────────────────────

describe('UpdateLabelOfJournalEntryUseCase', () => {
  function uc() {
    return new UpdateLabelOfJournalEntryUseCase(mockRepo as any, mockPeriodeLocks as any);
  }

  it('met à jour le libellé d\'une écriture BROUILLON (DAF)', async () => {
    mockRepo.getEntryMeta.mockResolvedValue(makeMeta('BROUILLON'));
    const updated = { id: 10, label: 'Nouveau libellé' } as any;
    mockRepo.updateLabelOfJournalEntry.mockResolvedValue(updated);

    const result = await uc().execute(10, 'Nouveau libellé', USER_ID, Role.DAF);
    expect(result).toBe(updated);
  });

  it('lève NotFoundException si introuvable', async () => {
    mockRepo.getEntryMeta.mockResolvedValue(null);
    await expect(uc().execute(99, 'x', USER_ID, Role.DAF)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lève ForbiddenException pour écriture VERROUILLE', async () => {
    mockRepo.getEntryMeta.mockResolvedValue(makeMeta('VERROUILLE'));
    await expect(uc().execute(10, 'x', USER_ID, Role.DAF)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lève ForbiddenException si ASSISTANT tente de modifier une écriture d\'un autre', async () => {
    mockRepo.getEntryMeta.mockResolvedValue(makeMeta('BROUILLON', 99));
    await expect(uc().execute(10, 'x', USER_ID, Role.ASSISTANT)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lève ForbiddenException si période verrouillée', async () => {
    mockRepo.getEntryMeta.mockResolvedValue(makeMeta('BROUILLON', USER_ID));
    mockPeriodeLocks.isLocked.mockResolvedValue(true);
    await expect(uc().execute(10, 'x', USER_ID, Role.DAF)).rejects.toBeInstanceOf(ForbiddenException);
  });
});

// ── LettrerLignesUseCase ───────────────────────────────────────────────────────

describe('LettrerLignesUseCase', () => {
  it('lettrage de 2+ lignes équilibrées', async () => {
    mockRepo.lettrerLignes.mockResolvedValue('A');

    const result = await new LettrerLignesUseCase(mockRepo as any).execute([1, 2], USER_ID);
    expect(result).toEqual({ lettre: 'A' });
  });

  it('lève BadRequestException si moins de 2 lignes', async () => {
    await expect(new LettrerLignesUseCase(mockRepo as any).execute([1], USER_ID))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('lève BadRequestException si le repository rejette (soldes déséquilibrés)', async () => {
    mockRepo.lettrerLignes.mockRejectedValue(new Error('Les lignes ne s\'équilibrent pas'));
    await expect(new LettrerLignesUseCase(mockRepo as any).execute([1, 2], USER_ID))
      .rejects.toBeInstanceOf(BadRequestException);
  });
});

// ── DelettrerLignesUseCase ─────────────────────────────────────────────────────

describe('DelettrerLignesUseCase', () => {
  it('délètre les lignes', async () => {
    mockRepo.deletterLignes.mockResolvedValue(undefined);

    await new DelettrerLignesUseCase(mockRepo as any).execute([1, 2], USER_ID);
    expect(mockRepo.deletterLignes).toHaveBeenCalledWith([1, 2], USER_ID);
  });
});

// ── GetJournalEntryByIdUseCase ─────────────────────────────────────────────────

describe('GetJournalEntryByIdUseCase', () => {
  it('retourne l\'écriture par id', async () => {
    const entry = { id: 10 } as any;
    mockRepo.getJournalById.mockResolvedValue(entry);

    const result = await new GetJournalEntryByIdUseCase(mockRepo as any).execute(10, USER_ID);
    expect(result).toBe(entry);
  });

  it('retourne null si introuvable', async () => {
    mockRepo.getJournalById.mockResolvedValue(null);
    const result = await new GetJournalEntryByIdUseCase(mockRepo as any).execute(99, USER_ID);
    expect(result).toBeNull();
  });
});
