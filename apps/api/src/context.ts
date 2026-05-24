import type { PrismaClient } from '@itin/db';

export type SessionUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  profileImageKey: string | null;
};

export type Variables = {
  prisma: PrismaClient;
  user: SessionUser | null;
  requestId: string;
};

export type Env = {
  Variables: Variables;
};
