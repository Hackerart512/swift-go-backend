// src/modules/voice/voice.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Twilio from 'twilio';

@Injectable()
export class VoiceService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Creates a temporary Access Token for a user to make an in-app call.
   * @param userId The unique ID of the user initiating the call.
   * @param recipientId The unique ID of the user being called.
   */
  generateToken(userId: string, recipientId: string): { token: string } {
    // --- USING MASTER CREDENTIALS AS PER THE LATEST ORDERS ---
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const twimlAppSid = this.configService.get<string>('TWILIO_TWIML_APP_SID');
    // -----------------------------------------------------------

    if (!authToken || !twimlAppSid || !accountSid) {
      throw new InternalServerErrorException(
        'Twilio Voice credentials are not fully configured in .env file.',
      );
    }

    // This is the unique identity for the user in the call (e.g., 'user_123' or 'driver_abc')
    const identity = userId;

    // Create a new Access Token using the Account SID and Auth Token
    const accessToken = new Twilio.jwt.AccessToken(
      accountSid,
      accountSid, // When using Auth Token, the "API Key SID" part is also the Account SID
      authToken,  // We use the master Auth Token here
      { identity: identity },
    );

    // Create a Voice Grant for the token, allowing outgoing calls
    const voiceGrant = new Twilio.jwt.AccessToken.VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      // Here we pass the ID of the person to call to our TwiML App
      outgoingApplicationParams: { to: recipientId },
    });

    // Add the grant to the token
    accessToken.addGrant(voiceGrant);

    // Return the token as a JWT string
    return { token: accessToken.toJwt() };
  }
}