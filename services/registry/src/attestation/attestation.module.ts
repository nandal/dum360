import { Module } from '@nestjs/common';
import { AttestationService } from './attestation.service';

@Module({
  providers: [AttestationService],
  exports: [AttestationService],
})
export class AttestationModule {}
