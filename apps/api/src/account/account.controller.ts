import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountService, CreateImapAccountDto } from './account.service';

@ApiTags('accounts')
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  @ApiOperation({ summary: 'Get all email accounts' })
  async getAccounts() {
    // TODO: Get userId from auth context
    const userId = 'default-user';
    return this.accountService.getAccounts(userId);
  }

  @Get(':accountId')
  @ApiOperation({ summary: 'Get account by ID' })
  async getAccount(@Param('accountId') accountId: string) {
    return this.accountService.getAccount(accountId);
  }

  @Post('imap')
  @ApiOperation({ summary: 'Create IMAP/SMTP account' })
  async createImapAccount(
    @Body()
    body: {
      email: string;
      password: string;
      imapHost: string;
      imapPort: number;
      imapSecure: boolean;
      smtpHost: string;
      smtpPort: number;
      smtpSecure: boolean;
    }
  ) {
    // TODO: Get userId from auth context
    const userId = 'default-user';
    const dto: CreateImapAccountDto = {
      userId,
      ...body,
    };
    return this.accountService.createImapAccount(dto);
  }

  @Delete(':accountId')
  @ApiOperation({ summary: 'Delete account' })
  async deleteAccount(@Param('accountId') accountId: string) {
    await this.accountService.deleteAccount(accountId);
    return { success: true };
  }

  @Get(':accountId/test')
  @ApiOperation({ summary: 'Test account connection' })
  async testConnection(@Param('accountId') accountId: string) {
    return this.accountService.testConnection(accountId);
  }

  @Get('google/auth-url')
  @ApiOperation({ summary: 'Get Google OAuth URL' })
  async getGoogleAuthUrl() {
    const url = this.accountService.getGoogleAuthUrl();
    return { url };
  }

  @Post('google/callback')
  @ApiOperation({ summary: 'Handle Google OAuth callback' })
  async connectGoogle(@Body() body: { code: string }) {
    // TODO: Get userId from auth context
    const userId = 'default-user';
    return this.accountService.connectGoogle(userId, body.code);
  }
}
