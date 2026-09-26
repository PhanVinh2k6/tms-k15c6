import { Module } from '@nestjs/common';
import { RolesModule } from './roles/roles.module';

@Module({
  imports: [RolesModule],
})
export class AppModule {}
