import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { OperationLog } from './entities/operation-log.entity';
import { Organization } from '../master/entities/organization.entity';
import { BudgetAccount } from '../master/entities/budget-account.entity';
import { IpdProject } from '../master/entities/ipd-project.entity';
import { Budget, BudgetItem } from '../budget/entities/budget.entity';
import { SeedService } from './services/seed.service';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { DashboardService } from './services/dashboard.service';
import { DashboardController } from './controllers/dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      OperationLog,
      Organization,
      BudgetAccount,
      IpdProject,
      Budget,
      BudgetItem,
    ]),
  ],
  controllers: [UserController, DashboardController],
  providers: [SeedService, UserService, DashboardService],
  exports: [UserService],
})
export class SystemModule {}
