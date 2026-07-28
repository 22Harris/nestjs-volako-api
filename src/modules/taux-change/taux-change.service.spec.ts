import { InternalServerErrorException } from '@nestjs/common';
import { TauxChangeService } from './taux-change.service';

describe('TauxChangeService', () => {
  let service: TauxChangeService;

  beforeEach(() => {
    service = new TauxChangeService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── getLatest ──────────────────────────────────────────────────────────────

  describe('getLatest', () => {
    it('retourne les taux courants formatés', async () => {
      const mockData = {
        time_last_update_utc: 'Mon, 05 May 2025 00:00:00 +0000',
        rates: { USD: 1.08, GBP: 0.86, MGA: 4800 },
      };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockData),
      } as any);

      const result = await service.getLatest();
      expect(result.base).toBe('EUR');
      expect(result.amount).toBe(1);
      expect(result.rates).toEqual(mockData.rates);
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('lève InternalServerErrorException si l\'API échoue', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 } as any);

      await expect(service.getLatest()).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  // ── getHistorical ──────────────────────────────────────────────────────────

  describe('getHistorical', () => {
    it('retourne les taux historiques', async () => {
      const mockData = { rates: { '2025-01-02': { USD: 1.05 } } };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockData),
      } as any);

      const result = await service.getHistorical('2025-01-01', '2025-01-07');
      expect(result).toEqual(mockData);
    });

    it('retourne null si la plage ne contient aucun jour ouvré', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 } as any);

      const result = await service.getHistorical('2025-01-04', '2025-01-05');
      expect(result).toBeNull();
    });

    it('utilise la devise spécifiée dans to', async () => {
      const mockData = { rates: {} };
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockData),
      } as any);
      global.fetch = mockFetch;

      await service.getHistorical('2025-01-01', '2025-01-07', 'MGA');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('to=MGA'));
    });
  });
});
