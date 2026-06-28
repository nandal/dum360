import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that validates node JWT tokens.
 * Use on all node-facing endpoints (heartbeat, poll, task result, log upload).
 */
@Injectable()
export class JwtNodeGuard extends AuthGuard('jwt-node') {}
