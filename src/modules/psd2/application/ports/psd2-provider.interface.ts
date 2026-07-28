export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface PsdTransaction {
  date: Date;
  libelle: string;
  montant: number;   // centimes, positif = crédit, négatif = débit
  reference?: string;
}

/** Port towards any PSD2 / Open Banking provider (STET, Berlin Group, etc.). */
export interface Psd2Provider {
  /** Returns the OAuth2 authorization URL for the given IBAN or provider. */
  buildAuthUrl(state: string, redirectUri: string): string;

  /** Exchanges an authorization code for tokens. */
  exchangeCode(code: string, redirectUri: string): Promise<TokenResponse>;

  /** Refreshes an expired access token. */
  refreshAccessToken(refreshToken: string): Promise<TokenResponse>;

  /** Fetches transactions for a given IBAN within a date range. */
  getTransactions(accessToken: string, iban: string, dateFrom: Date, dateTo: Date): Promise<PsdTransaction[]>;
}

export const PSD2_PROVIDER = 'PSD2_PROVIDER';
