import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DataImportService } from '../services/data-import.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('execution/import')
@UseGuards(JwtAuthGuard)
export class DataImportController {
  constructor(private readonly dataImportService: DataImportService) {}

  @Post('pr')
  @UseInterceptors(FileInterceptor('file'))
  async importPR(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    if (!file) {
      return {
        success: false,
        message: '请上传文件',
      };
    }

    const result = await this.dataImportService.importPR(
      file.buffer,
      req.user.id,
      file.originalname,
    );
    return result;
  }

  @Post('po')
  @UseInterceptors(FileInterceptor('file'))
  async importPO(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    if (!file) {
      return {
        success: false,
        message: '请上传文件',
      };
    }

    const result = await this.dataImportService.importPO(
      file.buffer,
      req.user.id,
      file.originalname,
    );
    return result;
  }

  @Post('settlement')
  @UseInterceptors(FileInterceptor('file'))
  async importSettlement(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      return {
        success: false,
        message: '请上传文件',
      };
    }

    const result = await this.dataImportService.importSettlement(
      file.buffer,
      req.user.id,
      file.originalname,
    );
    return result;
  }

  @Get('template/:type')
  async downloadTemplate(
    @Param('type') type: 'PR' | 'PO' | 'SETTLEMENT',
    @Res() res: Response,
  ) {
    const buffer = this.dataImportService.downloadTemplate(type);

    const filename = {
      PR: 'PR导入模板.xlsx',
      PO: 'PO导入模板.xlsx',
      SETTLEMENT: '结算导入模板.xlsx',
    }[type];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(buffer);
  }
}
