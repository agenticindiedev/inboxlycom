import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EncryptionService } from '../auth/services/encryption.service';
import { EmailAccount, EmailAccountSchema } from '../email/schemas/account.schema';
import { ImapService } from '../email/services/imap.service';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: EmailAccount.name, schema: EmailAccountSchema }])],
  controllers: [AccountController],
  providers: [AccountService, EncryptionService, ImapService],
  exports: [AccountService],
})
export class AccountModule {}
