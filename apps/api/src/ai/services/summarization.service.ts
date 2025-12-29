import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { CacheService } from '../../email/services/cache.service';

@Injectable()
export class SummarizationService {
  private readonly logger = new Logger(SummarizationService.name);
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
   * Summarize a single email
   */
  async summarizeEmail(emailText: string, emailHtml?: string): Promise<string> {
    const cacheKey = `summary:${this.hashText(emailText)}`;

    // Check cache
    const cached = await this.cacheService.getCachedAIResult(cacheKey);
    if (cached) {
      return cached;
    }

    const text = emailHtml ? this.extractTextFromHtml(emailHtml) : emailText;
    const prompt = `Summarize the following email in 2-3 sentences, highlighting the main points and any action items:

${text}`;

    try {
      if (!this.openai) {
        throw new Error('OpenRouter API key not configured');
      }

      const response = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that summarizes emails concisely.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
      });

      const summary = response.choices[0]?.message?.content || '';

      // Cache the result
      await this.cacheService.cacheAIResult(cacheKey, summary, 86400); // 24 hours

      return summary;
    } catch (error) {
      this.logger.error('Error summarizing email:', error);
      throw error;
    }
  }

  /**
   * Summarize an email thread
   */
  async summarizeThread(
    emails: Array<{ subject: string; body: string; from: string; date: string }>
  ): Promise<string> {
    const cacheKey = `thread:${this.hashText(emails.map((e) => e.body).join('|'))}`;

    // Check cache
    const cached = await this.cacheService.getCachedAIResult(cacheKey);
    if (cached) {
      return cached;
    }

    const threadText = emails
      .map((email, idx) => {
        return `Message ${idx + 1} (${email.from}, ${email.date}):\n${email.body}`;
      })
      .join('\n\n---\n\n');

    const prompt = `Summarize the following email thread in 3-5 sentences, highlighting:
- The main topic and discussion points
- Key decisions or conclusions
- Any action items or next steps

Thread:
${threadText}`;

    try {
      if (!this.openai) {
        throw new Error('OpenRouter API key not configured');
      }

      const response = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that summarizes email threads.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 300,
      });

      const summary = response.choices[0]?.message?.content || '';

      // Cache the result
      await this.cacheService.cacheAIResult(cacheKey, summary, 86400);

      return summary;
    } catch (error) {
      this.logger.error('Error summarizing thread:', error);
      throw error;
    }
  }

  /**
   * Condense a long email
   */
  async condenseEmail(emailText: string, maxLength = 500): Promise<string> {
    const cacheKey = `condense:${this.hashText(emailText)}:${maxLength}`;

    // Check cache
    const cached = await this.cacheService.getCachedAIResult(cacheKey);
    if (cached) {
      return cached;
    }

    const prompt = `Condense the following email to approximately ${maxLength} characters while preserving all important information, key points, and action items:

${emailText}`;

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
              'You are an AI assistant that condenses emails while preserving important information.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: Math.ceil(maxLength / 4),
      });

      const condensed = response.choices[0]?.message?.content || '';

      // Cache the result
      await this.cacheService.cacheAIResult(cacheKey, condensed, 86400);

      return condensed;
    } catch (error) {
      this.logger.error('Error condensing email:', error);
      throw error;
    }
  }

  private extractTextFromHtml(html: string): string {
    // Simple HTML to text extraction (in production, use a proper library)
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private hashText(text: string): string {
    return Buffer.from(text.substring(0, 500)).toString('base64').substring(0, 50);
  }
}
