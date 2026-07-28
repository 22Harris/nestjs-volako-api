import { Inject, Injectable } from '@nestjs/common';
import { PSD2_PROVIDER } from '../ports/psd2-provider.interface';
import type { Psd2Provider } from '../ports/psd2-provider.interface';
import { randomBytes } from 'node:crypto';

export interface InitiationResult {
  authUrl: string;
  state: string;
}

@Injectable()
export class InitierAutorisationUseCase {
  constructor(
    @Inject(PSD2_PROVIDER)
    private readonly provider: Psd2Provider,
  ) {}

  execute(redirectUri: string): InitiationResult {
    const state = randomBytes(16).toString('hex');
    const authUrl = this.provider.buildAuthUrl(state, redirectUri);
    return { authUrl, state };
  }
}
