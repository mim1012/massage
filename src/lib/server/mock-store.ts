import { Notice, QnA, Review, User } from '@/lib/types';
import { hashPassword } from '@/lib/auth/password';
import { seedNotices, seedQna, seedReviews, seedShops, seedUsers, type SeedUser } from '@/lib/server/sample-data';
import type { Shop } from '@/lib/types';

export interface StoredUser extends Omit<User, 'password'> {
  passwordHash: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  expiresAt: number;
}

interface AppStore {
  users: StoredUser[];
  shops: Shop[];
  reviews: Review[];
  notices: Notice[];
  qna: QnA[];
  sessions: Map<string, SessionRecord>;
}

const globalForStore = globalThis as typeof globalThis & {
  __massageStore?: AppStore;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildUsers(users: SeedUser[]): StoredUser[] {
  return users.map(({ password, ...user }) => ({
    ...user,
    passwordHash: hashPassword(password),
  }));
}

function createStore(): AppStore {
  return {
    users: buildUsers(seedUsers),
    shops: clone(seedShops),
    reviews: clone(seedReviews),
    notices: clone(seedNotices),
    qna: clone(seedQna),
    sessions: new Map<string, SessionRecord>(),
  };
}

export function getStore(): AppStore {
  if (!globalForStore.__massageStore) {
    globalForStore.__massageStore = createStore();
  }

  return globalForStore.__massageStore;
}
