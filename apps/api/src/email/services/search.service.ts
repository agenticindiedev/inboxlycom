import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Email, type EmailDocument } from '../schemas/email.schema';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(@InjectModel(Email.name) private emailModel: Model<EmailDocument>) {}

  /**
   * Full-text search across emails
   */
  async search(
    accountId: string,
    query: string,
    folder?: string,
    limit = 50,
    offset = 0
  ): Promise<Email[]> {
    const searchQuery: any = {
      accountId,
      $text: { $search: query },
    };

    if (folder) {
      searchQuery.folder = folder;
    }

    // MongoDB text search (requires text index)
    try {
      return this.emailModel
        .find(searchQuery, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, date: -1 })
        .limit(limit)
        .skip(offset)
        .exec();
    } catch (_error) {
      // Fallback to regex search if text index not available
      this.logger.warn('Text index not available, using regex search');
      return this.searchWithRegex(accountId, query, folder, limit, offset);
    }
  }

  /**
   * Regex-based search (fallback)
   */
  private async searchWithRegex(
    accountId: string,
    query: string,
    folder?: string,
    limit = 50,
    offset = 0
  ): Promise<Email[]> {
    const searchQuery: any = {
      accountId,
      $or: [
        { subject: { $regex: query, $options: 'i' } },
        { 'body.text': { $regex: query, $options: 'i' } },
        { 'from.address': { $regex: query, $options: 'i' } },
      ],
    };

    if (folder) {
      searchQuery.folder = folder;
    }

    return this.emailModel.find(searchQuery).sort({ date: -1 }).limit(limit).skip(offset).exec();
  }

  /**
   * Create text index for full-text search
   */
  async createTextIndex(): Promise<void> {
    try {
      await this.emailModel.collection.createIndex({
        subject: 'text',
        'body.text': 'text',
        'from.address': 'text',
      });
      this.logger.log('Text index created successfully');
    } catch (error) {
      this.logger.error('Error creating text index:', error);
    }
  }
}
