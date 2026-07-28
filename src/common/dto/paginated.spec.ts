import { toPaginated } from './paginated';

describe('toPaginated', () => {
  it('calcule totalPages correctement', () => {
    const result = toPaginated([1, 2, 3], 103, 1, 50);
    expect(result.totalPages).toBe(3);
    expect(result.total).toBe(103);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.data).toEqual([1, 2, 3]);
  });

  it('retourne 1 page si données < pageSize', () => {
    const result = toPaginated(['a', 'b'], 2, 1, 50);
    expect(result.totalPages).toBe(1);
  });

  it('retourne 0 pages si aucune donnée', () => {
    const result = toPaginated([], 0, 1, 50);
    expect(result.totalPages).toBe(0);
  });

  it('arrondit à l\'entier supérieur', () => {
    const result = toPaginated([], 51, 1, 50);
    expect(result.totalPages).toBe(2);
  });
});
