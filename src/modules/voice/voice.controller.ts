// src/modules/voice/voice.controller.ts
import { Controller, Post, UseGuards, Request, Body, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import * as Twilio from 'twilio';
import { VoiceService } from './voice.service';
import { UserJwtAuthGuard } from '../auth/guards/user-jwt-auth.guard';
// --- IMPORT THE VALIDATORS ---
import { IsNotEmpty, IsString } from 'class-validator';

// --- ADD VALIDATORS TO THE DTO ---
class CreateCallTokenDto {
  @IsNotEmpty()
  @IsString()
  recipientId: string;
}

@ApiTags('Voice Call')
@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  /**
   * This endpoint is called by the mobile app.
   * It's protected, so only a logged-in user can get a token.
   */
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a token for an in-app voice call' })
  @Post('token')
  generateToken(@Request() req, @Body() body: CreateCallTokenDto) {
    // req.user.id is the ID of the logged-in user from the JWT
    const userId = req.user.id;
    const { recipientId } = body;

    return this.voiceService.generateToken(userId, recipientId);
  }

  /**
   * This endpoint is called BY TWILIO, not your app.
   * This is the "Request URL" we will configure in our TwiML App later.
   * It tells Twilio what to do when a user makes a call.
   */
  @ApiOperation({
    summary: 'Handle TwiML instructions for outgoing calls (Called by Twilio)',
  })
  @Post('twiml')
  handleTwiml(@Body() body: { to: string }, @Res() res: Response) {
    const { to } = body; // 'to' is the recipientId we passed in the token

    const twiml = new Twilio.twiml.VoiceResponse();

    // Create a <Dial> instruction
    const dial = twiml.dial();
    // Instruct Twilio to dial another client, identified by their ID
    dial.client({}, to);

    res.type('text/xml');
    res.send(twiml.toString());
  }
}