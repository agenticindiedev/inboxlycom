import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { CacheService } from '../../email/services/cache.service';

@Injectable()
export class ComposeService {
  private readonly logger = new Logger(ComposeService.name);
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
   * Get smart compose suggestions
   */
  async getSuggestions(
    context: string,
    draft: string,
    tone: 'professional' | 'casual' | 'friendly' = 'professional'
  ): Promise<string[]> {
    const cacheKey = `compose:${this.hashContext(context, draft, tone)}`;

    // Check cache
    const cached = await this.cacheService.getCachedAIResult(cacheKey);
    if (cached) {
      return cached;
    }

    const prompt = this.buildComposePrompt(context, draft, tone);

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
              'You are an AI assistant that helps compose professional emails. Provide 3-5 concise suggestions to complete the draft.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      const suggestions = content ? this.parseSuggestions(content) : [];

      // Cache the result
      await this.cacheService.cacheAIResult(cacheKey, suggestions, 1800); // 30 minutes

      return suggestions;
    } catch (error) {
      this.logger.error('Error generating compose suggestions:', error);
      throw error;
    }
  }

  /**
   * Generate complete email draft
   */
  async generateDraft(
    subject: string,
    recipient: string,
    context?: string,
    tone: 'professional' | 'casual' | 'friendly' = 'professional'
  ): Promise<string> {
    const cacheKey = `draft:${this.hashContext(subject, recipient, context || '', tone)}`;

    // Check cache
    const cached = await this.cacheService.getCachedAIResult(cacheKey);
    if (cached) {
      return cached;
    }

    const prompt = `Generate a ${tone} email draft with the following details:
Subject: ${subject}
Recipient: ${recipient}
${context ? `Context: ${context}` : ''}

Write a complete, well-structured email that is appropriate for the tone and context.`;

    try {
      if (!this.openai) {
        throw new Error('OpenRouter API key not configured');
      }

      const response = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that helps compose professional emails.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
      });

      const draft = response.choices[0]?.message?.content || '';

      // Cache the result
      await this.cacheService.cacheAIResult(cacheKey, draft, 1800);

      return draft;
    } catch (error) {
      this.logger.error('Error generating draft:', error);
      throw error;
    }
  }

  /**
   * Adjust tone of email
   */
  async adjustTone(
    text: string,
    targetTone: 'professional' | 'casual' | 'friendly'
  ): Promise<string> {
    const cacheKey = `tone:${this.hashContext(text, targetTone)}`;

    // Check cache
    const cached = await this.cacheService.getCachedAIResult(cacheKey);
    if (cached) {
      return cached;
    }

    const prompt = `Rewrite the following email text to have a ${targetTone} tone while maintaining the same meaning and key information:

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
            content: 'You are an AI assistant that adjusts the tone of emails.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
      });

      const adjusted = response.choices[0]?.message?.content || '';

      // Cache the result
      await this.cacheService.cacheAIResult(cacheKey, adjusted, 1800);

      return adjusted;
    } catch (error) {
      this.logger.error('Error adjusting tone:', error);
      throw error;
    }
  }

  private buildComposePrompt(context: string, draft: string, tone: string): string {
    return `You are helping compose a ${tone} email. 

Context: ${context}

Current draft:
${draft}

Provide 3-5 concise suggestions (1-2 sentences each) to complete or improve this draft. Format each suggestion on a new line starting with "- ".`;
  }

  private parseSuggestions(text: string): string[] {
    return text
      .split('\n')
      .map((line) => line.replace(/^[-•]\s*/, '').trim())
      .filter((line) => line.length > 0)
      .slice(0, 5);
  }

  private hashContext(...args: string[]): string {
    // Simple hash for caching
    return Buffer.from(args.join('|')).toString('base64').substring(0, 50);
  }
}
