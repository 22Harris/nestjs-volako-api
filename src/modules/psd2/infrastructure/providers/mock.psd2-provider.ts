import { Injectable } from '@nestjs/common';
import type { Psd2Provider, TokenResponse, PsdTransaction } from '../../application/ports/psd2-provider.interface';

/** Deterministic mock provider for development and testing. */
@Injectable()
export class MockPsd2Provider implements Psd2Provider {
  buildAuthUrl(state: string, redirectUri: string): string {
    return `https://mock-bank.example.com/oauth/authorize?state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
  }

  async exchangeCode(_code: string, _redirectUri: string): Promise<TokenResponse> {
    return {
      accessToken:  'mock_access_token',
      refreshToken: 'mock_refresh_token',
      expiresAt:    new Date(Date.now() + 3600 * 1000),
    };
  }

  async refreshAccessToken(_refreshToken: string): Promise<TokenResponse> {
    return {
      accessToken:  'mock_access_token_refreshed',
      refreshToken: 'mock_refresh_token_new',
      expiresAt:    new Date(Date.now() + 3600 * 1000),
    };
  }

  async getTransactions(_accessToken: string, _iban: string, dateFrom: Date, _dateTo: Date): Promise<PsdTransaction[]> {
    const base = new Date(dateFrom);
    return [
      { date: new Date(base.setDate(base.getDate() + 1)), libelle: 'Virement client ABC',   montant:  150000, reference: 'VIR-001' },
      { date: new Date(base.setDate(base.getDate() + 2)), libelle: 'Prélèvement EDF',        montant: -18500,  reference: 'PRE-042' },
      { date: new Date(base.setDate(base.getDate() + 1)), libelle: 'Paiement fournisseur XY', montant: -75000, reference: 'PAI-099' },
    ];
  }
}
