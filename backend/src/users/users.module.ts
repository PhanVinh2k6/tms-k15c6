import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ActorMiddleware } from '../roles/actor.middleware';
import { AdminGuard } from '../roles/admin.guard';
import { ClassAssignmentModule } from './class-assignment.module';
import { ConsoleMailService, MailService } from './mail.service';
import { AccountSecurityController } from './account-security.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [ClassAssignmentModule],
  controllers: [UsersController, AccountSecurityController],
  providers: [UsersService, AdminGuard, { provide: MailService, useClass: ConsoleMailService }],
  exports: [UsersService],
})
export class UsersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ActorMiddleware).forRoutes(UsersController, AccountSecurityController);
  }
}
