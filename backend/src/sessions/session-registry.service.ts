import { Injectable, UnauthorizedException } from '@nestjs/common';

/**
 * Session registry cho scaffold hiện tại. Khi tích hợp JWT, sessionId phải lấy từ
 * claim `sid` đã xác thực, không lấy trực tiếp từ header do client tự khai.
 */
@Injectable()
export class SessionRegistry {
  private readonly activeSessionsByUser = new Map<string, Set<string>>();
  private readonly sessionOwners = new Map<string, string>();
  private readonly revokedSessionsByUser = new Map<string, Set<string>>();

  registerSession(userId: string, sessionId: string): void {
    if (!sessionId || sessionId.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(sessionId)) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'INVALID_SESSION',
        message: 'Định danh phiên đăng nhập không hợp lệ.',
      });
    }

    const existingOwner = this.sessionOwners.get(sessionId);
    if (existingOwner && existingOwner !== userId) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'INVALID_SESSION',
        message: 'Định danh phiên đăng nhập không hợp lệ.',
      });
    }

    if (this.revokedSessionsByUser.get(userId)?.has(sessionId)) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'SESSION_REVOKED',
        message: 'Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại.',
      });
    }

    this.sessionOwners.set(sessionId, userId);
    const active = this.activeSessionsByUser.get(userId) ?? new Set<string>();
    active.add(sessionId);
    this.activeSessionsByUser.set(userId, active);
  }

  /** Thu hồi mọi session đã biết của user, ngoại trừ session đang đổi mật khẩu. */
  revokeOtherSessions(userId: string, currentSessionId: string): number {
    this.registerSession(userId, currentSessionId);

    const active = this.activeSessionsByUser.get(userId) ?? new Set<string>();
    const revoked = this.revokedSessionsByUser.get(userId) ?? new Set<string>();
    let revokedCount = 0;

    for (const sessionId of active) {
      if (sessionId === currentSessionId) continue;
      revoked.add(sessionId);
      active.delete(sessionId);
      revokedCount += 1;
    }

    active.add(currentSessionId);
    this.activeSessionsByUser.set(userId, active);
    this.revokedSessionsByUser.set(userId, revoked);
    return revokedCount;
  }
}
