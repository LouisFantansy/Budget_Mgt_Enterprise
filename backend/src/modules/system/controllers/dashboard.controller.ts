import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboardData(@Query('year') year?: number) {
    return await this.dashboardService.getDashboardData(year ? parseInt(String(year), 10) : undefined);
  }
}
