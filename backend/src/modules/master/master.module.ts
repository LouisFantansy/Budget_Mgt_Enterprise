import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { IpdProject } from './entities/ipd-project.entity';
import { BudgetAccount } from './entities/budget-account.entity';
import { OrganizationService } from './services/organization.service';
import { IpdProjectService } from './services/ipd-project.service';
import { BudgetAccountService } from './services/budget-account.service';
import { OrganizationController } from './controllers/organization.controller';
import { IpdProjectController } from './controllers/ipd-project.controller';
import { BudgetAccountController } from './controllers/budget-account.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, IpdProject, BudgetAccount]),
  ],
  controllers: [
    OrganizationController,
    IpdProjectController,
    BudgetAccountController,
  ],
  providers: [OrganizationService, IpdProjectService, BudgetAccountService],
  exports: [OrganizationService, IpdProjectService, BudgetAccountService],
})
export class MasterModule {}
