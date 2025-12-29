import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailController } from './email.controller';
import { EmailAccount, EmailAccountSchema } from './schemas/account.schema';
import { Email, EmailSchema } from './schemas/email.schema';
import { CacheService } from './services/cache.service';
import { EmailService } from './services/email.service';
import { ImapService } from './services/imap.service';
import { SearchService } from './services/search.service';
import { SmtpService } from './services/smtp.service';
import { SyncService } from './services/sync.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Email.name, schema: EmailSchema },
      { name: EmailAccount.name, schema: EmailAccountSchema },
    ]),
  ],
  controllers: [EmailController],
  providers: [EmailService, ImapService, SmtpService, CacheService, SyncService, SearchService],
  exports: [EmailService, SyncService, SearchService],
})
export class EmailModule {}
