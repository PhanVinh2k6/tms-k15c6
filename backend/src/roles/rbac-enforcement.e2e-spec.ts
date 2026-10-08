import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { ProgramsController } from '../programs/programs.controller';
import { AccountSecurityController } from '../users/account-security.controller';
import { PasswordResetController } from '../users/password-reset.controller';
import { UsersController } from '../users/users.controller';
import { PermissionGuard } from './permission.guard';
import { REQUIRED_PERMISSION_KEY } from './require-permission.decorator';
import { RolesController } from './roles.controller';

const as = (id: string, roles: string) => ({ 'x-user-id': id, 'x-user-roles': roles });

/**
 * S1-05: "Mọi chức năng đều kiểm quyền ở tầng server, mặc định là từ chối".
 * Controller nào nằm trong danh sách này BẮT BUỘC có @UseGuards(PermissionGuard) và
 * @RequirePermission trên từng route. Thêm route mới mà quên phân quyền → test đỏ.
 */
const GUARDED_CONTROLLERS = [UsersController, RolesController, ProgramsController];

/** Route cố ý không cần quyền theo vai trò: chỉ cần đăng nhập (tự đổi mật khẩu) hoặc công khai (quên mật khẩu). */
const SELF_SERVICE_OR_PUBLIC_CONTROLLERS = [AccountSecurityController, PasswordResetController];

describe('S1-05 phân quyền ở tầng server', () => {
  describe('mặc định từ chối (kiểm tra cấu hình mọi route)', () => {
    it.each(GUARDED_CONTROLLERS.map((controller) => [controller.name, controller] as const))(
      '%s: mọi route đều khai báo quyền và có PermissionGuard',
      (_name, controller) => {
        const guards: unknown[] = Reflect.getMetadata('__guards__', controller) ?? [];
        expect(guards).toContain(PermissionGuard);

        const handlers = Object.getOwnPropertyNames(controller.prototype)
          .filter((name) => name !== 'constructor')
          .map((name) => ({ name, handler: (controller.prototype as unknown as Record<string, unknown>)[name] }))
          .filter(({ handler }) => typeof handler === 'function' && Reflect.hasMetadata('method', handler as object));

        expect(handlers.length).toBeGreaterThan(0);
        for (const { name, handler } of handlers) {
          const permission = Reflect.getMetadata(REQUIRED_PERMISSION_KEY, handler as object);
          expect({ route: `${controller.name}.${name}`, permission: Boolean(permission) }).toEqual({
            route: `${controller.name}.${name}`,
            permission: true,
          });
        }
      },
    );

    it('chỉ các controller tự phục vụ / công khai được phép không dùng PermissionGuard', () => {
      for (const controller of SELF_SERVICE_OR_PUBLIC_CONTROLLERS) {
        expect(Reflect.getMetadata('__guards__', controller)).toBeUndefined();
      }
    });
  });

  describe('thực thi trên API thật', () => {
    let app: INestApplication;
    const http = () => request(app.getHttpServer());

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
      app = moduleRef.createNestApplication();
      await app.init();
    });
    afterAll(async () => app.close());

    it('ADMIN được xem, tạo và gán vai trò', async () => {
      await http().get('/users').set(as('admin-1', 'ADMIN')).expect(200);
      await http().post('/users/user-1/roles/TA').set(as('admin-1', 'ADMIN')).expect(201);
    });

    it('INSTRUCTOR bị từ chối mọi API quản trị với thông báo tiếng Việt', async () => {
      const response = await http().get('/users').set(as('user-1', 'INSTRUCTOR')).expect(403);
      expect(response.body.code).toBe('FORBIDDEN');
      expect(response.body.message).toBe('Bạn không có quyền thực hiện thao tác này.');
      await http().get('/users/user-1/roles').set(as('user-1', 'INSTRUCTOR')).expect(403);
    });

    it('TRAINING_MANAGER xem được danh sách nhưng không tạo/khoá/xoá tài khoản và không gán vai trò', async () => {
      const tm = as('tm-1', 'TRAINING_MANAGER');
      await http().get('/users').set(tm).expect(200);
      await http().post('/users').set(tm).send({}).expect(403);
      await http().post('/users/user-1/lock').set(tm).send({ reason: 'Nghỉ việc' }).expect(403);
      await http().delete('/users/user-1').set(tm).expect(403);
      await http().post('/users/user-1/roles/ADMIN').set(tm).expect(403);
    });

    it('ADMISSIONS và ACCOUNTANT chỉ được đọc, không được ghi người dùng', async () => {
      for (const roles of ['ADMISSIONS', 'ACCOUNTANT']) {
        const actor = as('x-1', roles);
        await http().get('/users').set(actor).expect(200);
        await http().patch('/users/user-1').set(actor).send({ fullName: 'Hacker' }).expect(403);
        await http().post('/users/user-1/unlock').set(actor).expect(403);
      }
    });

    it('STUDENT, TA và GUEST không vào được API quản trị', async () => {
      for (const roles of ['STUDENT', 'TA', 'GUEST']) {
        await http().get('/users').set(as('x-1', roles)).expect(403);
      }
    });

    it('người có nhiều vai trò được hưởng quyền của vai trò mạnh nhất', async () => {
      await http().post('/users').set(as('x-1', 'INSTRUCTOR,ADMIN')).send({}).expect(400); // qua quyền, rơi vào validation
    });

    it('thiếu danh tính thì 401, không phải 403', async () => {
      await http().get('/users').expect(401);
    });
  });
});
