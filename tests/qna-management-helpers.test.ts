import assert from 'node:assert/strict';
import test from 'node:test';
import type { QnA } from '@/lib/types';
import {
  addDeletingQnaId,
  addSubmittingQnaId,
  buildDeleteQnaConfirmMessage,
  getThreadComments,
  removeDeletingQnaId,
  removeManagedQna,
  removeSubmittingQnaId,
} from '@/components/admin/qna-management-helpers';

const baseQna: QnA = {
  id: 'qna-1',
  question: '예약 가능한가요?',
  authorName: '손님1',
  isAnswered: false,
  commentCount: 0,
  comments: [],
  createdAt: '2026-05-16T00:00:00.000Z',
};

test('getThreadComments falls back to legacy answer when explicit comments are missing', () => {
  const comments = getThreadComments({
    ...baseQna,
    answer: '가능합니다. 연락 주세요.',
  });

  assert.equal(comments.length, 1);
  assert.equal(comments[0]?.content, '가능합니다. 연락 주세요.');
  assert.equal(comments[0]?.authorName, '운영진');
});

test('buildDeleteQnaConfirmMessage warns when operator comments will also be removed', () => {
  const message = buildDeleteQnaConfirmMessage({
    ...baseQna,
    shopName: '강남 힐링스파',
    comments: [
      {
        id: 'comment-1',
        qnaId: 'qna-1',
        authorName: '운영진',
        role: 'ADMIN',
        authorRole: 'ADMIN',
        content: '안내드립니다.',
        createdAt: '2026-05-16T00:10:00.000Z',
      },
    ],
  });

  assert.match(message, /강남 힐링스파/);
  assert.match(message, /예약 가능한가요/);
  assert.match(message, /등록된 댓글 1개도 함께 삭제됩니다/);
});

test('buildDeleteQnaConfirmMessage omits comment warning when no staff thread exists', () => {
  const message = buildDeleteQnaConfirmMessage(baseQna);

  assert.match(message, /일반 문의/);
  assert.doesNotMatch(message, /함께 삭제됩니다/);
});

test('removeManagedQna removes only the targeted qna entry', () => {
  const qnaList = [
    baseQna,
    { ...baseQna, id: 'qna-2', question: '주차 가능한가요?' },
  ];

  assert.deepEqual(removeManagedQna(qnaList, 'qna-2').map((item) => item.id), ['qna-1']);
});

test('addDeletingQnaId avoids duplicate pending ids for the same row', () => {
  assert.deepEqual(addDeletingQnaId(['qna-1'], 'qna-1'), ['qna-1']);
  assert.deepEqual(addDeletingQnaId(['qna-1'], 'qna-2'), ['qna-1', 'qna-2']);
});

test('addSubmittingQnaId avoids duplicate pending ids for the same row', () => {
  assert.deepEqual(addSubmittingQnaId(['qna-1'], 'qna-1'), ['qna-1']);
  assert.deepEqual(addSubmittingQnaId(['qna-1'], 'qna-2'), ['qna-1', 'qna-2']);
});

test('removeDeletingQnaId removes only the targeted pending id', () => {
  assert.deepEqual(removeDeletingQnaId(['qna-1', 'qna-2'], 'qna-1'), ['qna-2']);
  assert.deepEqual(removeDeletingQnaId(['qna-1', 'qna-2'], 'missing-qna'), ['qna-1', 'qna-2']);
});

test('removeSubmittingQnaId removes only the targeted pending id', () => {
  assert.deepEqual(removeSubmittingQnaId(['qna-1', 'qna-2'], 'qna-1'), ['qna-2']);
  assert.deepEqual(removeSubmittingQnaId(['qna-1', 'qna-2'], 'missing-qna'), ['qna-1', 'qna-2']);
});
