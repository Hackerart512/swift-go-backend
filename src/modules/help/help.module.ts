// src/modules/help/help.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HelpService } from './help.service';
import { HelpController, AdminHelpController } from './help.controller';
import { HelpCategory } from './entities/help-category.entity';
import { FaqItem } from './entities/faq-item.entity';
// import { AuthModule } from '../auth/auth.module'; // To use guards

@Module({
  imports: [
    TypeOrmModule.forFeature([HelpCategory, FaqItem]),
    // AuthModule, // Import if your admin controllers use JwtAuthGuard
  ],
  controllers: [HelpController, AdminHelpController], // Register both controllers
  providers: [HelpService],
})
export class HelpModule {}