import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { ImportExportController } from './import-export.controller';
import { PrismaModule } from 'src/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ExportService],
  controllers: [ImportExportController],
})
export class ImportExportModule {}
