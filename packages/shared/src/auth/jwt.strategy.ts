import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtNodePayload {
  sub: string;       // nodeId
  name: string;      // node name
  iat: number;
  exp: number;
}

/**
 * Passport strategy for validating node JWT tokens.
 * Extracts bearer token from Authorization header.
 */
@Injectable()
export class JwtNodeStrategy extends PassportStrategy(Strategy, 'jwt-node') {
  constructor(jwtSecret: string) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtNodePayload): Promise<JwtNodePayload> {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token: missing nodeId');
    }
    return payload;
  }
}
