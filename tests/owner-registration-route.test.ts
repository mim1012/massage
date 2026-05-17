import assert from 'node:assert/strict';
import { test } from 'node:test';
import { registerOwnerRoute } from '../src/lib/auth/owner-registration';

const validBody = {
  name: '홍길동',
  email: 'owner@example.com',
  password: 'secret1234',
  businessName: '강남 힐링스파',
  businessNumber: '123-45-67890',
  phone: '010-1234-5678',
};

test('registerOwnerRoute returns 400 when a required field is missing', async () => {
  const response = await registerOwnerRoute(
    { ...validBody, phone: '' },
    {
      registerOwner: async () => {
        throw new Error('should not be called');
      },
    },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: '필수 입력값이 누락되었습니다.' });
});

test('registerOwnerRoute creates a pending owner without auto-login side effects', async () => {
  const calls: string[] = [];
  const user = { id: 'owner-1', email: validBody.email, role: 'OWNER', status: 'pending' };

  const response = await registerOwnerRoute(validBody, {
    registerOwner: async (input) => {
      calls.push(`register:${input.email}`);
      return user;
    },
  });

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    user,
    requiresApproval: true,
    nextUrl: '/auth/login?notice=pending-approval',
    message: '관리자 승인 후 로그인할 수 있습니다.',
  });
  assert.deepEqual(calls, ['register:owner@example.com']);
});
