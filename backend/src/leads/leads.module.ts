import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ActorMiddleware } from '../roles/actor.middleware';
import { PermissionGuard } from '../roles/permission.guard';
import { UsersModule } from '../users/users.module';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [UsersModule],
  controllers: [LeadsController],
  providers: [LeadsService, PermissionGuard, ActorMiddleware],
  exports: [LeadsService],
})
export class LeadsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ActorMiddleware).forRoutes(LeadsController);
  }
}
