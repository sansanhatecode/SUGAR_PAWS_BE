import { Injectable } from '@nestjs/common';

@Injectable()
export class LogoutService {
  private invalidatedTokens: Set<string> = new Set();

  invalidateToken(token: string) {
    this.invalidatedTokens.add(token);
  }

  isTokenInvalidated(token: string): boolean {
    return this.invalidatedTokens.has(token);
  }
}
