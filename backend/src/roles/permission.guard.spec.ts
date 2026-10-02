import {
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PermissionGuard } from './permission.guard';
import { Permission } from './permission.types';
import { Role } from './role.types';

describe('PermissionGuard - S1-05 RBAC', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;

  const createContext = (roles: Role[]): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          actor: {
            id: 'test-user',
            roles: new Set(roles),
          },
        }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector;

    guard = new PermissionGuard(reflector);
  });

  it('ADMIN được phép thực hiện TUITION_WRITE', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(Permission.TUITION_WRITE);

    const context = createContext([Role.ADMIN]);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('ACCOUNTANT được phép thực hiện TUITION_WRITE', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(Permission.TUITION_WRITE);

    const context = createContext([Role.ACCOUNTANT]);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('INSTRUCTOR không được phép thực hiện TUITION_WRITE', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(Permission.TUITION_WRITE);

    const context = createContext([Role.INSTRUCTOR]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('STUDENT được phép đọc điểm', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(Permission.GRADE_READ);

    const context = createContext([Role.STUDENT]);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('STUDENT không được phép sửa học phí', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(Permission.TUITION_WRITE);

    const context = createContext([Role.STUDENT]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('không có permission được khai báo thì từ chối truy cập', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(undefined);

    const context = createContext([Role.ADMIN]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('không có role thì từ chối truy cập', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(Permission.TUITION_WRITE);

    const context = createContext([]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
  it('INSTRUCTOR bị từ chối TUITION_WRITE với response 403 chuẩn', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(Permission.TUITION_WRITE);

    const context = createContext([Role.INSTRUCTOR]);

     try {
      guard.canActivate(context);
      throw new Error('Expected ForbiddenException');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);

      const response = (error as ForbiddenException).getResponse();

      expect(response).toEqual({
        statusCode: 403,
          code: 'FORBIDDEN',
        message: 'Bạn không có quyền thực hiện thao tác này.',
      });
    }
  });
});
