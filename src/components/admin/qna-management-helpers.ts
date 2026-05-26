import type { QnA, QnAComment } from '@/lib/types';

type DeletePromptQna = Pick<QnA, 'id' | 'question' | 'shopId' | 'shopName' | 'comments' | 'answer' | 'createdAt'>;

export function getThreadComments(qna: Pick<QnA, 'id' | 'comments' | 'answer' | 'createdAt'>): QnAComment[] {
  if (Array.isArray(qna.comments) && qna.comments.length > 0) {
    return qna.comments;
  }

  if (qna.answer?.trim()) {
    return [
      {
        id: `${qna.id}-legacy-answer`,
        qnaId: qna.id,
        content: qna.answer,
        authorName: '운영진',
        role: 'ADMIN',
        authorRole: 'ADMIN',
        createdAt: qna.createdAt,
      },
    ];
  }

  return [];
}

export function buildDeleteQnaConfirmMessage(qna: DeletePromptQna): string {
  const threadComments = getThreadComments(qna);
  const shopName = qna.shopName ?? (qna.shopId ? '업소 문의' : '일반 문의');
  const commentNotice =
    threadComments.length > 0 ? `\n등록된 댓글 ${threadComments.length}개도 함께 삭제됩니다.` : '';

  return `[${shopName}]\n"${qna.question}"\n문의글을 삭제할까요?${commentNotice}`;
}

export function removeManagedQna(qnaList: QnA[], qnaId: string) {
  return qnaList.filter((qna) => qna.id !== qnaId);
}

export function addDeletingQnaId(deletingIds: string[], qnaId: string) {
  return deletingIds.includes(qnaId) ? deletingIds : [...deletingIds, qnaId];
}

export function removeDeletingQnaId(deletingIds: string[], qnaId: string) {
  return deletingIds.filter((id) => id !== qnaId);
}

export function addSubmittingQnaId(submittingIds: string[], qnaId: string) {
  return submittingIds.includes(qnaId) ? submittingIds : [...submittingIds, qnaId];
}

export function removeSubmittingQnaId(submittingIds: string[], qnaId: string) {
  return submittingIds.filter((id) => id !== qnaId);
}
