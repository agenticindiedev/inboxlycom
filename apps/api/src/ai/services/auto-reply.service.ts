import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { CacheService } from '../../email/services/cache.service';

@Injectable()
export class AutoReplyService {
  private readonly logger = new Logger(AutoReplyService.name);
  private openai: OpenAI | null = null;
  private readonly defaultModel = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';

  constructor(private cacheService: CacheService) {
    if (process.env.OPENROUTER_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'https://github.com/your-repo',
          'X-Title': process.env.OPENROUTER_APP_NAME || 'AI Email Client',
        },
      });
    }
  }

  /**
   * Generate auto-reply draft
   */
  async generateReply(
    originalEmail: {
      subject: string;
      body: string;
      from: string;
    },
    context?: string,
    tone: 'professional' | 'casual' | 'friendly' = 'professional'
  ): Promise<string> {
    const cacheKey = `reply:${this.hashText(originalEmail.subject + originalEmail.body)}`;

    // Check cache
    const cached = await this.cacheService.getCachedAIResult(cacheKey);
    if (cached) {
      return cached;
    }

    const prompt = `Generate a ${tone} email reply to the following message. The reply should be:
- Appropriate and contextually relevant
- Professional yet personable
- Concise but complete
- Address any questions or requests in the original email

Original Email:
Subject: ${originalEmail.subject}
From: ${originalEmail.from}
Body: ${originalEmail.body}

${context ? `Additional Context: ${context}` : ''}

Generate a complete email reply that can be sent as-is or edited by the user.`;

    try {
      if (!this.openai) {
        throw new Error('OpenRouter API key not configured');
      }

      const response = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant that generates email replies. Generate complete, ready-to-send replies.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
      });

      const reply = response.choices[0]?.message?.content || '';

      // Cache the result
      await this.cacheService.cacheAIResult(cacheKey, reply, 3600); // 1 hour

      return reply;
    } catch (error) {
      this.logger.error('Error generating reply:', error);
      throw error;
    }
  }

  /**
   * Generate multiple reply options
   */
  async generateReplyOptions(
    originalEmail: {
      subject: string;
      body: string;
      from: string;
    },
    count = 3
  ): Promise<string[]> {
    const options: string[] = [];

    for (let i = 0; i < count; i++) {
      const tone = i === 0 ? 'professional' : i === 1 ? 'friendly' : 'casual';
      const reply = await this.generateReply(originalEmail, undefined, tone);
      options.push(reply);
    }

    return options;
  }

  private hashText(text: string): string {
    return Buffer.from(text.substring(0, 500)).toString('base64').substring(0, 50);
  }
}
