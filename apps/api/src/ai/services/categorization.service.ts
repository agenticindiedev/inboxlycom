import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { CacheService } from '../../email/services/cache.service';

@Injectable()
export class CategorizationService {
  private readonly logger = new Logger(CategorizationService.name);
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
   * Categorize an email
   */
  async categorizeEmail(
    subject: string,
    body: string,
    from: string
  ): Promise<{ category: string; priority: number; isSpam: boolean }> {
    const cacheKey = `category:${this.hashText(subject + body + from)}`;

    // Check cache
    const cached = await this.cacheService.getCachedAIResult(cacheKey);
    if (cached) {
      return cached;
    }

    const prompt = `Analyze the following email and categorize it. Return a JSON object with:
- category: one of "work", "personal", "newsletter", "promotion", "notification", "social", "other"
- priority: a number from 1-5 where 1 is urgent and 5 is low priority
- isSpam: true if this appears to be spam, false otherwise

Email:
Subject: ${subject}
From: ${from}
Body: ${body.substring(0, 1000)}`;

    try {
      if (!this.openai) {
        throw new Error('OpenRouter API key not configured');
      }

      const response = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that categorizes emails. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      const result = content
        ? this.parseCategorization(content)
        : {
            category: 'other',
            priority: 3,
            isSpam: false,
          };

      // Cache the result
      await this.cacheService.cacheAIResult(cacheKey, result, 86400);

      return result;
    } catch (error) {
      this.logger.error('Error categorizing email:', error);
      return {
        category: 'other',
        priority: 3,
        isSpam: false,
      };
    }
  }

  /**
   * Detect spam
   */
  async detectSpam(subject: string, body: string, from: string): Promise<boolean> {
    const result = await this.categorizeEmail(subject, body, from);
    return result.isSpam;
  }

  /**
   * Get priority score
   */
  async getPriority(subject: string, body: string, from: string): Promise<number> {
    const result = await this.categorizeEmail(subject, body, from);
    return result.priority;
  }

  private parseCategorization(text: string): {
    category: string;
    priority: number;
    isSpam: boolean;
  } {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(text);
      return {
        category: parsed.category || 'other',
        priority: parsed.priority || 3,
        isSpam: parsed.isSpam,
      };
    } catch {
      // Fallback parsing
      const categoryMatch = text.match(/category["\s:]+(\w+)/i);
      const priorityMatch = text.match(/priority["\s:]+(\d+)/i);
      const spamMatch = text.match(/isSpam["\s:]+(true|false)/i);

      return {
        category: categoryMatch?.[1] || 'other',
        priority: priorityMatch ? Number.parseInt(priorityMatch[1]) : 3,
        isSpam: spamMatch?.[1] === 'true',
      };
    }
  }

  private hashText(text: string): string {
    return Buffer.from(text.substring(0, 500)).toString('base64').substring(0, 50);
  }
}
