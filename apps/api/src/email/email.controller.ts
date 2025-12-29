import { Attachment, EmailAddress } from '@ai-email/shared';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmailService } from './services/email.service';
import { SearchService } from './services/search.service';

@ApiTags('emails')
@Controller('emails')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly searchService: SearchService
  ) {}

  @Get('accounts/:accountId/sync')
  @ApiOperation({ summary: 'Sync emails for an account' })
  async syncAccount(@Param('accountId') accountId: string) {
    const count = await this.emailService.syncAccount(accountId);
    return { synced: count };
  }

  @Get('accounts/:accountId')
  @ApiOperation({ summary: 'Get emails for an account' })
  async getEmails(
    @Param('accountId') accountId: string,
    @Query('folder') folder = 'INBOX',
    @Query('limit') limit = 50,
    @Query('offset') offset = 0
  ) {
    return this.emailService.getEmails(accountId, folder, Number(limit), Number(offset));
  }

  @Get('accounts/:accountId/threads')
  @ApiOperation({ summary: 'Get email threads for an account' })
  async getThreads(@Param('accountId') accountId: string, @Query('limit') limit = 50) {
    return this.emailService.getThreads(accountId, Number(limit));
  }

  @Get(':emailId')
  @ApiOperation({ summary: 'Get email by ID' })
  async getEmail(@Param('emailId') emailId: string) {
    return this.emailService.getEmailById(emailId);
  }

  @Post('accounts/:accountId/send')
  @ApiOperation({ summary: 'Send email' })
  async sendEmail(
    @Param('accountId') accountId: string,
    @Body()
    body: {
      to: EmailAddress[];
      subject: string;
      body: { text?: string; html?: string };
      cc?: EmailAddress[];
      bcc?: EmailAddress[];
      replyTo?: EmailAddress;
      attachments?: Attachment[];
      inReplyTo?: string;
      references?: string[];
    }
  ) {
    const messageId = await this.emailService.sendEmail(
      accountId,
      body.to,
      body.subject,
      body.body,
      {
        cc: body.cc,
        bcc: body.bcc,
        replyTo: body.replyTo,
        attachments: body.attachments,
        inReplyTo: body.inReplyTo,
        references: body.references,
      }
    );
    return { messageId };
  }

  @Get('accounts/:accountId/search')
  @ApiOperation({ summary: 'Search emails' })
  async searchEmails(
    @Param('accountId') accountId: string,
    @Query('q') query: string,
    @Query('folder') folder?: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0
  ) {
    return this.searchService.search(accountId, query, folder, Number(limit), Number(offset));
  }
}
