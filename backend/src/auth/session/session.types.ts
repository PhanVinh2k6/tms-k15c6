export interface SessionRecord {
  id: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  revokedAt: number | null;
}
