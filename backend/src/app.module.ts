import { Module } from '@nestjs/common';
import { RolesModule } from './roles/roles.module';
import { SessionsModule } from './sessions/sessions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [SessionsModule, RolesModule, UsersModule],
})
export class AppModule {}
