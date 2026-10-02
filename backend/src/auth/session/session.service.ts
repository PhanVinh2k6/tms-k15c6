import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SessionRecord } from './session.types';

@Injectable()
export class SessionService {
  private readonly sessions = new Map<string, SessionRecord>();

  create(userId: string, ttlSeconds: number): SessionRecord {
    const now = Date.now();
    const session: SessionRecord = {
      id: randomUUID(),
      userId,
      createdAt: now,
      expiresAt: now + ttlSeconds * 1000,
      revokedAt: null,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  find(id: string): SessionRecord | undefined {
    return this.sessions.get(id);
  }

  isActive(id: string, userId: string): boolean {
    const session = this.find(id);
    return Boolean(session && session.userId === userId && !session.revokedAt && session.expiresAt > Date.now());
  }

  revoke(id: string, userId: string): boolean {
    const session = this.find(id);
    if (!session || session.userId !== userId || session.revokedAt) return false;
    session.revokedAt = Date.now();
    return true;
  }

  listForUser(userId: string): SessionRecord[] {
    return [...this.sessions.values()].filter((session) => session.userId === userId && !session.revokedAt && session.expiresAt > Date.now());
  }
}
