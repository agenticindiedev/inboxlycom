import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AutoReplyService } from './services/auto-reply.service';
import { CategorizationService } from './services/categorization.service';
import { ComposeService } from './services/compose.service';
import { SummarizationService } from './services/summarization.service';

@ApiTags('ai')
@Controller('ai')
export class AIController {
  constructor(
    private composeService: ComposeService,
    private summarizationService: SummarizationService,
    private categorizationService: CategorizationService,
    private autoReplyService: AutoReplyService
  ) {}

  @Post('compose/suggestions')
  @ApiOperation({ summary: 'Get smart compose suggestions' })
  async getSuggestions(
    @Body()
    body: {
      context: string;
      draft: string;
      tone?: 'professional' | 'casual' | 'friendly';
    }
  ) {
    return this.composeService.getSuggestions(
      body.context,
      body.draft,
      body.tone || 'professional'
    );
  }

  @Post('compose/generate')
  @ApiOperation({ summary: 'Generate complete email draft' })
  async generateDraft(
    @Body()
    body: {
      subject: string;
      recipient: string;
      context?: string;
      tone?: 'professional' | 'casual' | 'friendly';
    }
  ) {
    return {
      draft: await this.composeService.generateDraft(
        body.subject,
        body.recipient,
        body.context,
        body.tone || 'professional'
      ),
    };
  }

  @Post('compose/adjust-tone')
  @ApiOperation({ summary: 'Adjust email tone' })
  async adjustTone(
    @Body()
    body: {
      text: string;
      targetTone: 'professional' | 'casual' | 'friendly';
    }
  ) {
    return {
      adjusted: await this.composeService.adjustTone(body.text, body.targetTone),
    };
  }

  @Post('summarize/email')
  @ApiOperation({ summary: 'Summarize a single email' })
  async summarizeEmail(
    @Body()
    body: {
      text: string;
      html?: string;
    }
  ) {
    return {
      summary: await this.summarizationService.summarizeEmail(body.text, body.html),
    };
  }

  @Post('summarize/thread')
  @ApiOperation({ summary: 'Summarize an email thread' })
  async summarizeThread(
    @Body()
    body: {
      emails: Array<{
        subject: string;
        body: string;
        from: string;
        date: string;
      }>;
    }
  ) {
    return {
      summary: await this.summarizationService.summarizeThread(body.emails),
    };
  }

  @Post('summarize/condense')
  @ApiOperation({ summary: 'Condense a long email' })
  async condenseEmail(
    @Body()
    body: {
      text: string;
      maxLength?: number;
    }
  ) {
    return {
      condensed: await this.summarizationService.condenseEmail(body.text, body.maxLength || 500),
    };
  }

  @Post('categorize')
  @ApiOperation({ summary: 'Categorize an email' })
  async categorizeEmail(
    @Body()
    body: {
      subject: string;
      body: string;
      from: string;
    }
  ) {
    return this.categorizationService.categorizeEmail(body.subject, body.body, body.from);
  }

  @Post('auto-reply/generate')
  @ApiOperation({ summary: 'Generate auto-reply draft' })
  async generateReply(
    @Body()
    body: {
      originalEmail: {
        subject: string;
        body: string;
        from: string;
      };
      context?: string;
      tone?: 'professional' | 'casual' | 'friendly';
    }
  ) {
    return {
      reply: await this.autoReplyService.generateReply(
        body.originalEmail,
        body.context,
        body.tone || 'professional'
      ),
    };
  }

  @Post('auto-reply/options')
  @ApiOperation({ summary: 'Generate multiple reply options' })
  async generateReplyOptions(
    @Body()
    body: {
      originalEmail: {
        subject: string;
        body: string;
        from: string;
      };
      count?: number;
    }
  ) {
    return {
      options: await this.autoReplyService.generateReplyOptions(
        body.originalEmail,
        body.count || 3
      ),
    };
  }
}
