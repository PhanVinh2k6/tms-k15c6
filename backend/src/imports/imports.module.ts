import { Module } from '@nestjs/common';
import { UserImportController } from './controllers/user-import.controller';
import { UserImportService } from './services/user-import.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [UserImportController],
  providers: [UserImportService],
})
export class ImportsModule {}