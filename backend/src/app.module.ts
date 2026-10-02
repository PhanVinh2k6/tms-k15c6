import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { AppController } from './app.controller';

@Module({
  imports: [AuthModule, RolesModule],
  controllers: [AppController],
})
export class AppModule {}
