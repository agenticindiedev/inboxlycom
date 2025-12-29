import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { Document } from 'mongoose';

export type EmailAccountDocument = EmailAccount & Document;

@Schema({ timestamps: true })
export class EmailAccount {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, enum: ['gmail', 'outlook', 'imap'] })
  provider: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  encryptedCredentials: string;

  @Prop({ type: Object })
  oauth2Tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  };

  @Prop({ type: Object })
  imapConfig?: {
    host: string;
    port: number;
    secure: boolean;
    username?: string;
    password?: string;
  };

  @Prop({ type: Object })
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    username?: string;
    password?: string;
  };

  @Prop()
  lastSyncAt?: Date;
}

export const EmailAccountSchema = SchemaFactory.createForClass(EmailAccount);
