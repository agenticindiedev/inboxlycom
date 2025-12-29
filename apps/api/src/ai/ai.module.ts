import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { AIController } from './ai.controller';
import { AutoReplyService } from './services/auto-reply.service';
import { CategorizationService } from './services/categorization.service';
import { ComposeService } from './services/compose.service';
import { SummarizationService } from './services/summarization.service';

@Module({
  imports: [EmailModule],
  controllers: [AIController],
  providers: [ComposeService, SummarizationService, CategorizationService, AutoReplyService],
  exports: [ComposeService, SummarizationService, CategorizationService, AutoReplyService],
})
export class AIModule {}
