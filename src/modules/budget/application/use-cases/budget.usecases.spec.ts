import { CreateBudgetUseCase } from './create-budget.usecase';
import { FindBudgetsUseCase } from './find-budgets.usecase';
import { DeleteBudgetUseCase } from './delete-budget.usecase';
import { GetBudgetByMoisUseCase } from './get-budget-by-mois.usecase';
import { SaveLigneUseCase } from './save-ligne.usecase';
import { DeleteLigneUseCase } from './delete-ligne.usecase';
import { Budget, BudgetLigne } from '../../domain/entities/budget.entity';

const mockRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  delete: jest.fn(),
  findByMois: jest.fn(),
  saveLigne: jest.fn(),
  deleteLigne: jest.fn(),
};

const USER_ID = 1;

function makeBudget(id = 1): Budget {
  return { id, exercice: 2025, mois: 6, lignes: [] } as Budget;
}

beforeEach(() => jest.clearAllMocks());

describe('CreateBudgetUseCase', () => {
  it('crée un budget', async () => {
    const b = makeBudget();
    mockRepo.create.mockResolvedValue(b);

    const result = await new CreateBudgetUseCase(mockRepo as any).execute(2025, 6, USER_ID);
    expect(result).toBe(b);
    expect(mockRepo.create).toHaveBeenCalledWith(2025, 6, USER_ID);
  });
});

describe('FindBudgetsUseCase', () => {
  it('retourne tous les budgets', async () => {
    const list = [makeBudget()];
    mockRepo.findAll.mockResolvedValue(list);

    const result = await new FindBudgetsUseCase(mockRepo as any).execute(USER_ID);
    expect(result).toBe(list);
  });
});

describe('DeleteBudgetUseCase', () => {
  it('supprime un budget', async () => {
    mockRepo.delete.mockResolvedValue(undefined);
    await new DeleteBudgetUseCase(mockRepo as any).execute(1, USER_ID);
    expect(mockRepo.delete).toHaveBeenCalledWith(1, USER_ID);
  });
});

describe('GetBudgetByMoisUseCase', () => {
  it('retourne le budget d\'un mois', async () => {
    const b = makeBudget();
    mockRepo.findByMois.mockResolvedValue(b);

    const result = await new GetBudgetByMoisUseCase(mockRepo as any).execute(2025, 6, USER_ID);
    expect(result).toBe(b);
    expect(mockRepo.findByMois).toHaveBeenCalledWith(2025, 6, USER_ID);
  });

  it('retourne null si aucun budget', async () => {
    mockRepo.findByMois.mockResolvedValue(null);
    expect(await new GetBudgetByMoisUseCase(mockRepo as any).execute(2025, 1, USER_ID)).toBeNull();
  });
});

describe('SaveLigneUseCase', () => {
  it('sauvegarde une ligne de budget', async () => {
    const b = makeBudget();
    mockRepo.saveLigne.mockResolvedValue(b);

    const ligne = { categorie: 'EXPLOITATION', libelle: 'Salaires', montantPrevu: 50000, type: 'CHARGE', budgetId: 1 };
    const result = await new SaveLigneUseCase(mockRepo as any).execute(1, ligne, USER_ID);
    expect(result).toBe(b);
  });
});

describe('DeleteLigneUseCase', () => {
  it('supprime une ligne de budget', async () => {
    const b = makeBudget();
    mockRepo.deleteLigne.mockResolvedValue(b);

    const result = await new DeleteLigneUseCase(mockRepo as any).execute(1, 10, USER_ID);
    expect(result).toBe(b);
    expect(mockRepo.deleteLigne).toHaveBeenCalledWith(1, 10, USER_ID);
  });
});

// ── Budget entity ──────────────────────────────────────────────────────────────

describe('BudgetLigne entity', () => {
  it('crée une ligne avec toutes les propriétés', () => {
    const ligne = new BudgetLigne('EXPLOITATION', 'Salaires', 50000, 'CHARGE', 1, 5);
    expect(ligne.categorie).toBe('EXPLOITATION');
    expect(ligne.montantPrevu).toBe(50000);
    expect(ligne.id).toBe(5);
  });
});

describe('Budget entity', () => {
  it('crée un budget avec ses propriétés', () => {
    const budget = new Budget(2025, 6, [], 1);
    expect(budget.exercice).toBe(2025);
    expect(budget.mois).toBe(6);
    expect(budget.lignes).toHaveLength(0);
  });
});
