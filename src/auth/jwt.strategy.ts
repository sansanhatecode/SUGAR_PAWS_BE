import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: number;
  username: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secret_key',
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async validate(
    payload: JwtPayload,
  ): Promise<{ userId: number; username: string; role: string }> {
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
