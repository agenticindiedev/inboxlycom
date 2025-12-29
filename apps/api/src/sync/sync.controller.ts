import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SyncService } from '../email/services/sync.service';

@ApiTags('sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('accounts/:accountId')
  @ApiOperation({ summary: 'Sync emails for an account' })
  async syncAccount(@Param('accountId') accountId: string) {
    const count = await this.syncService.syncAccount(accountId);
    return { synced: count };
  }

  @Post('all')
  @ApiOperation({ summary: 'Sync all accounts' })
  async syncAll() {
    await this.syncService.syncAllAccounts();
    return { message: 'Sync started for all accounts' };
  }

  @Get('accounts/:accountId/status')
  @ApiOperation({ summary: 'Get sync status for an account' })
  async getSyncStatus(@Param('accountId') accountId: string) {
    return this.syncService.getSyncStatus(accountId);
  }
}
