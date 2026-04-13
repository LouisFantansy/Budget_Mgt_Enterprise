import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrganizationService } from '../services/organization.service';
import { Organization } from '../entities/organization.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('master/organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  async create(@Body() createOrgDto: Partial<Organization>) {
    return await this.organizationService.create(createOrgDto);
  }

  @Get()
  async findAll() {
    return await this.organizationService.findAll();
  }

  @Get('tree')
  async findTree() {
    return await this.organizationService.findTree();
  }

  @Get('level/:level')
  async findByLevel(@Param('level') level: string) {
    return await this.organizationService.findByLevel(+level);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.organizationService.findOne(id);
  }

  @Get(':id/children')
  async findChildren(@Param('id') id: string) {
    return await this.organizationService.findChildren(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateOrgDto: Partial<Organization>,
  ) {
    return await this.organizationService.update(id, updateOrgDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.organizationService.remove(id);
    return { message: '删除成功' };
  }
}
