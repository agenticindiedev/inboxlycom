import { Module, OnModuleInit } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { SyncService } from '../email/services/sync.service';
import { SyncController } from './sync.controller';
import { SyncGateway } from './sync.gateway';

@Module({
  imports: [EmailModule],
  controllers: [SyncController],
  providers: [SyncGateway],
  exports: [SyncGateway],
})
export class SyncModule implements OnModuleInit {
  constructor(
    private syncGateway: SyncGateway,
    private syncService: SyncService
  ) {}

  onModuleInit() {
    // Connect sync gateway to sync service
    this.syncService.setSyncGateway(this.syncGateway);
  }
}
