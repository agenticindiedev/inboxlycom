import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailDocument = Email & Document;

@Schema({ timestamps: true })
export class Email {
  @Prop({ required: true, unique: true })
  messageId: string;

  @Prop({ required: true, index: true })
  threadId: string;

  @Prop({ required: true, index: true })
  accountId: string;

  @Prop({ required: true, index: true })
  folder: string;

  @Prop({ required: true, type: Object })
  from: {
    name?: string;
    address: string;
  };

  @Prop({ required: true, type: [Object] })
  to: Array<{
    name?: string;
    address: string;
  }>;

  @Prop({ type: [Object], default: [] })
  cc?: Array<{
    name?: string;
    address: string;
  }>;

  @Prop({ type: [Object], default: [] })
  bcc?: Array<{
    name?: string;
    address: string;
  }>;

  @Prop({ required: true })
  subject: string;

  @Prop({ type: Object })
  body: {
    text?: string;
    html?: string;
  };

  @Prop({ type: [Object], default: [] })
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
    contentId?: string;
  }>;

  @Prop({ type: [String], default: [] })
  flags: string[];

  @Prop({ required: true, index: true })
  date: Date;

  @Prop({ required: true, index: true })
  receivedDate: Date;

  @Prop()
  aiSummary?: string;

  @Prop()
  aiCategory?: string;

  @Prop()
  aiPriority?: number;

  @Prop({ default: Date.now })
  syncedAt: Date;
}

export const EmailSchema = SchemaFactory.createForClass(Email);

// Create indexes
EmailSchema.index({ accountId: 1, folder: 1, date: -1 });
EmailSchema.index({ threadId: 1 });
EmailSchema.index({ accountId: 1, syncedAt: -1 });
