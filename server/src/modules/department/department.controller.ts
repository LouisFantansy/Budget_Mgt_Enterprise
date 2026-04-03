import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserType } from 'src/common/decorators/current-user.decorator';

@ApiTags('部门管理')
@Controller('departments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @ApiOperation({ summary: '创建部门' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentService.create(createDepartmentDto);
  }

  @Get('tree')
  @ApiOperation({ summary: '获取部门树' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAllTree(@CurrentUser() user: CurrentUserType) {
    return this.departmentService.findAllTree(user);
  }

  @Get()
  @ApiOperation({ summary: '获取所有部门（扁平列表）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll(@CurrentUser() user: CurrentUserType) {
    return this.departmentService.findAllTree(user);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取部门详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '部门不存在' })
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.departmentService.findOne(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新部门' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '部门不存在' })
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除部门' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '部门不存在' })
  remove(@Param('id') id: string) {
    return this.departmentService.remove(id);
  }
}
