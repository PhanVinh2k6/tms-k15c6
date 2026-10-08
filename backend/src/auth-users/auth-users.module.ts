import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthUsersService } from './auth-users.service';
import { User } from './user.entity';
import { ProfileController } from './profile.controller';
const persistenceImports = process.env.NODE_ENV !== 'test' && process.env.DATABASE_URL
  ? [TypeOrmModule.forFeature([User])]
  : [];
@Module({
  imports: persistenceImports,
  controllers: [ProfileController],
  providers: [AuthUsersService],
  exports: [AuthUsersService],
})
export class AuthUsersModule {}
