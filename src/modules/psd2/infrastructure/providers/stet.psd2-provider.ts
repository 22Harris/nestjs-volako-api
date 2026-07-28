import { Injectable, Logger } from '@nestjs/common';
import type { Psd2Provider, TokenResponse, PsdTransaction } from '../../application/ports/psd2-provider.interface';

/**
 * STET-compliant PSD2 provider (standard used by major French banks).
 * Requires environment variables:
 *   PSD2_BASE_URL        — e.g. https://api.mybank.fr/stet/psd2/v1
 *   PSD2_CLIENT_ID       — OAuth2 client ID
 *   PSD2_CLIENT_SECRET   — OAuth2 client secret
 */
@Injectable()
export class StetPsd2Provider implements Psd2Provider {
  private readonly logger     = new Logger(StetPsd2Provider.name);
  private readonly baseUrl    = process.env['PSD2_BASE_URL']      ?? '';
  private readonly clientId   = process.env['PSD2_CLIENT_ID']     ?? '';
  private readonly clientSecret = process.env['PSD2_CLIENT_SECRET'] ?? '';

  buildAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     this.clientId,
      redirect_uri:  redirectUri,
      scope:         'aisp',
      state,
    });
    return `${this.baseUrl}/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenResponse> {
    const res = await fetch(`${this.baseUrl}/token`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  redirectUri,
        client_id:     this.clientId,
        client_secret: this.clientSecret,
      }).toString(),
    });
    return this.extractTokens(res);
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const res = await fetch(`${this.baseUrl}/token`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token: refreshToken,
        client_id:     this.clientId,
        client_secret: this.clientSecret,
      }).toString(),
    });
    return this.extractTokens(res);
  }

  async getTransactions(accessToken: string, iban: string, dateFrom: Date, dateTo: Date): Promise<PsdTransaction[]> {
    const params = new URLSearchParams({
      dateFrom: dateFrom.toISOString().slice(0, 10),
      dateTo:   dateTo.toISOString().slice(0, 10),
    });
    const res = await fetch(
      `${this.baseUrl}/accounts/${iban}/transactions?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } },
    );
    if (!res.ok) {
      this.logger.error(`PSD2 getTransactions error ${res.status} for IBAN ${iban}`);
      throw new Error(`Erreur provider PSD2 : ${res.status}`);
    }
    type StetTx = { bookingDate: string; remittanceInformationUnstructured: string; transactionAmount: { amount: string }; entryReference?: string };
    const body = await res.json() as { transactions?: StetTx[] };
    return (body.transactions ?? []).map(t => ({
      date:      new Date(t.bookingDate),
      libelle:   t.remittanceInformationUnstructured,
      montant:   Math.round(Number.parseFloat(t.transactionAmount.amount) * 100),
      reference: t.entryReference,
    }));
  }

  private async extractTokens(res: Response): Promise<TokenResponse> {
    if (!res.ok) throw new Error(`Erreur OAuth PSD2 : ${res.status}`);
    const body = await res.json() as { access_token: string; refresh_token?: string; expires_in?: number };
    return {
      accessToken:  body.access_token,
      refreshToken: body.refresh_token,
      expiresAt:    body.expires_in ? new Date(Date.now() + body.expires_in * 1000) : undefined,
    };
  }
}
