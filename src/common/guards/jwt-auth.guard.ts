import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Priorité au cookie httpOnly, fallback sur Authorization header
    const token: string | undefined =
      request.cookies?.['access_token'] ?? this.extractBearerToken(request);

    if (!token) throw new UnauthorizedException('Token manquant');

    try {
      const payload = this.jwtService.verify(token);
      request.user = { id: payload.sub, email: payload.email };
      return true;
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }

  private extractBearerToken(request: any): string | undefined {
    const authHeader: string | undefined = request.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
    return undefined;
  }
}
