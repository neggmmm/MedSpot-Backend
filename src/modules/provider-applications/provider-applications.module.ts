import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProviderApplicationsController } from './provider-applications.controller';
import { ProviderApplicationsService } from './provider-applications.service';
import { ProviderApplication } from './infrastructure/typeorm/provider-application.orm-entity';
import { User } from '../users/users.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProviderApplication, User]), AuditModule],
  controllers: [ProviderApplicationsController],
  providers: [ProviderApplicationsService],
})
export class ProviderApplicationsModule {}
