import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { IpdProjectService } from '../services/ipd-project.service';
import { IpdProject } from '../entities/ipd-project.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('master/ipd-projects')
@UseGuards(JwtAuthGuard)
export class IpdProjectController {
  constructor(private readonly ipdProjectService: IpdProjectService) {}

  @Post()
  async create(@Body() createDto: Partial<IpdProject>) {
    return await this.ipdProjectService.create(createDto);
  }

  @Get()
  async findAll() {
    return await this.ipdProjectService.findAll();
  }

  @Get('tree')
  async findTree() {
    return await this.ipdProjectService.findTree();
  }

  @Get('status/:status')
  async findByStatus(@Param('status') status: string) {
    return await this.ipdProjectService.findByStatus(status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.ipdProjectService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: Partial<IpdProject>,
  ) {
    return await this.ipdProjectService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.ipdProjectService.remove(id);
    return { message: '删除成功' };
  }
}
