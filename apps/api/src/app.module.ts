import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountModule } from './account/account.module';
import { AIModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.DATABASE_URL || 'mongodb://localhost:27017/ai-email'),
    AccountModule,
    AuthModule,
    EmailModule,
    AIModule,
    SyncModule,
  ],
})
export class AppModule {
  // TODO: Add Redis module when available
  // For now, CacheService will need Redis connection configured separately
}
