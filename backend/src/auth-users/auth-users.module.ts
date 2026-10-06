import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthUsersService } from './auth-users.service';
import { User } from './user.entity';
import { ProfileController } from './profile.controller';
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [ProfileController],
  providers: [AuthUsersService],
  exports: [AuthUsersService],
})
export class AuthUsersModule {}
