import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthUsersModule } from '../auth-users/auth-users.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
@Global()
@Module({
  imports: [
    ConfigModule,
    AuthUsersModule,
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: () => ({}) }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
