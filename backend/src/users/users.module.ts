import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ActorMiddleware } from '../roles/actor.middleware';
import { PermissionGuard } from '../roles/permission.guard';
import { ClassAssignmentModule } from './class-assignment.module';
import { ConsoleMailService, MailService } from './mail.service';
import { AccountSecurityController } from './account-security.controller';
import { PasswordResetController } from './password-reset.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [ClassAssignmentModule],
  controllers: [UsersController, AccountSecurityController, PasswordResetController],
  providers: [
    UsersService,
    PermissionGuard,
    ActorMiddleware,
    { provide: MailService, useClass: ConsoleMailService },
  ],
  exports: [UsersService],
})
export class UsersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ActorMiddleware).forRoutes(UsersController, AccountSecurityController);
  }
}
