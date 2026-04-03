import { Injectable, InternalServerErrorException } from '@nestjs/common';

const FRANKFURTER_API = 'https://api.frankfurter.app';
const OPEN_ER_API = 'https://open.er-api.com/v6/latest/EUR';

/** Devises BCE (frankfurter.app) — utilisées pour l'historique uniquement */
const ECB_TRACKED =
  'USD,GBP,CHF,JPY,CAD,AUD,CNY,HKD,SGD,INR,KRW,BRL,MXN,ZAR,NZD,TRY,IDR,ILS,ISK,MYR,PHP,RON,THB,SEK,NOK,DKK,PLN,CZK,HUF';

@Injectable()
export class TauxChangeService {
  /**
   * Taux courants via open.er-api.com (166 devises, dont MGA).
   * La réponse est transformée pour correspondre au format frankfurter attendu par le frontend.
   */
  async getLatest() {
    const res = await fetch(OPEN_ER_API);
    if (!res.ok) {
      throw new InternalServerErrorException(
        `Erreur open.er-api.com (HTTP ${res.status})`,
      );
    }
    const data = await res.json();
    // Transformer au format { amount, base, date, rates } compatible avec le frontend
    const dateStr = new Date(data.time_last_update_utc).toISOString().split('T')[0];
    return {
      amount: 1,
      base: 'EUR',
      date: dateStr,
      rates: data.rates as Record<string, number>,
    };
  }

  /**
   * Historique via frankfurter.app (devises BCE uniquement).
   * Retourne null si la plage ne contient aucun jour ouvré (week-end, jours fériés).
   */
  async getHistorical(startDate: string, endDate: string, to?: string) {
    const currencies = to ?? ECB_TRACKED;
    const url = `${FRANKFURTER_API}/${startDate}..${endDate}?base=EUR&to=${currencies}`;
    try {
      return await this.fetchJson(url);
    } catch {
      return null;
    }
  }

  private async fetchJson(url: string) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new InternalServerErrorException(
        `Erreur lors de la récupération des taux (HTTP ${res.status})`,
      );
    }
    return res.json();
  }
}
