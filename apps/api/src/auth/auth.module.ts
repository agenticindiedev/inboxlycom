import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailAccount, EmailAccountSchema } from '../email/schemas/account.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: EmailAccount.name, schema: EmailAccountSchema }])],
  providers: [],
  exports: [],
})
export class AuthModule {
  // TODO: Implement OAuth2 flows for Gmail and Outlook
}
