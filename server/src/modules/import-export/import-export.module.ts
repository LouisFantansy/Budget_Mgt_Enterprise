import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { ImportService } from './import.service';
import { MappingService } from './mapping.service';
import { ImportExportController } from './import-export.controller';
import { PrismaModule } from 'src/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ExportService, ImportService, MappingService],
  controllers: [ImportExportController],
  exports: [ExportService, ImportService, MappingService],
})
export class ImportExportModule {}
