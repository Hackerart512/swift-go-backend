// src/modules/voice/voice.module.ts

import { Module } from '@nestjs/common';
import { VoiceController } from './voice.controller';
import { VoiceService } from './voice.service';
import { AuthModule } from '../auth/auth.module'; // We need this to use the auth guards

@Module({
  imports: [AuthModule], // <-- Import AuthModule to use UserJwtAuthGuard
  controllers: [VoiceController],
  providers: [VoiceService],
})
export class VoiceModule {}