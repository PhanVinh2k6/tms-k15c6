import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ActorMiddleware } from '../roles/actor.middleware';
import { PermissionGuard } from '../roles/permission.guard';
import { ClassRunningLookup, NoRunningClassesLookup } from './class-running';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';

@Module({
  controllers: [ProgramsController],
  providers: [
    ProgramsService,
    PermissionGuard,
    ActorMiddleware,
    {
      provide: ClassRunningLookup,
      useClass: NoRunningClassesLookup,
    },
  ],
  exports: [ProgramsService, ClassRunningLookup],
})
export class ProgramsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ActorMiddleware).forRoutes(ProgramsController);
  }
}
