import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ActorMiddleware } from './actor.middleware';
import { AdminGuard } from './admin.guard';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { PermissionGuard } from './permission.guard';

@Module({
  controllers: [RolesController],
  providers: [RolesService, AdminGuard, PermissionGuard],
})
export class RolesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ActorMiddleware).forRoutes(RolesController);
  }
}
