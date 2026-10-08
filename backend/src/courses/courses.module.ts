import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ActorMiddleware } from '../roles/actor.middleware';
import { PermissionGuard } from '../roles/permission.guard';
import { CourseClassLookup, NoCourseClassLookup } from './course-class.lookup';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

@Module({
  controllers: [CoursesController],
  providers: [
    CoursesService,
    PermissionGuard,
    ActorMiddleware,
    {
      provide: CourseClassLookup,
      useClass: NoCourseClassLookup,
    },
  ],
  exports: [CoursesService, CourseClassLookup],
})
export class CoursesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ActorMiddleware).forRoutes(CoursesController);
  }
}
