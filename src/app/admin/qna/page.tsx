'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { CheckCircle, Clock, MessageCircle, Search, Send } from 'lucide-react';
import type { QnA, QnAComment } from '@/lib/types';
import { formatDate } from '@/lib/utils';

type TabKey = 'all' | 'pending' | 'done';

const TABS = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '미완료' },
  { key: 'done', label: '답변완료' },
] satisfies Array<{ key: TabKey; label: string }>;

function getThreadComments(qna: QnA): QnAComment[] {
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

export default function AdminQnAPage() {
  const [qnaList, setQnaList] = useState<QnA[]>([]);
  const [tab, setTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [activeComposerId, setActiveComposerId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/board/qna', { cache: 'no-store' });
        const result = (await response.json()) as { qna?: QnA[]; error?: string };

        if (!response.ok || !result.qna) {
          throw new Error(result.error ?? 'Q&A 목록을 불러오지 못했습니다.');
        }

        setQnaList(result.qna);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Q&A 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const pendingCount = useMemo(
    () => qnaList.filter((qna) => !(qna.isAnswered || getThreadComments(qna).length > 0)).length,
    [qnaList],
  );
  const doneCount = qnaList.length - pendingCount;

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return qnaList.filter((qna) => {
      const threadComments = getThreadComments(qna);
      const isDone = qna.isAnswered || threadComments.length > 0;
      const matchesTab = tab === 'pending' ? !isDone : tab === 'done' ? isDone : true;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        qna.question.toLowerCase().includes(normalizedSearch) ||
        qna.authorName.toLowerCase().includes(normalizedSearch) ||
        (qna.shopName ?? '').toLowerCase().includes(normalizedSearch) ||
        threadComments.some((comment) => comment.content.toLowerCase().includes(normalizedSearch));

      return matchesTab && matchesSearch;
    });
  }, [qnaList, search, tab]);

  async function handleCommentSubmit(id: string) {
    const trimmedComment = drafts[id]?.trim();
    if (!trimmedComment) {
      return;
    }

    setSubmittingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/qna/${id}/answer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: trimmedComment, comment: trimmedComment }),
      });
      const result = (await response.json()) as { qna?: QnA; error?: string };

      if (!response.ok || !result.qna) {
        throw new Error(result.error ?? '댓글을 등록하지 못했습니다.');
      }

      setQnaList((current) => current.map((qna) => (qna.id === id ? result.qna ?? qna : qna)));
      setActiveComposerId(null);
      setDrafts((current) => ({ ...current, [id]: '' }));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '댓글을 등록하지 못했습니다.');
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="max-w-[800px] space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
          <MessageCircle className="h-5 w-5 text-red-600" /> Q&A 답변 관리
        </h1>
        <div className="rounded bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">
          검색 결과 {filtered.length}건 / 전체 {qnaList.length}건
        </div>
      </div>

      <div className="flex gap-0 border-b border-gray-200">
        {TABS.map((tabOption) => {
          const count = tabOption.key === 'all' ? qnaList.length : tabOption.key === 'pending' ? pendingCount : doneCount;

          return (
            <button
              key={tabOption.key}
              onClick={() => setTab(tabOption.key)}
              className={clsx(
                'flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-bold transition-colors',
                tab === tabOption.key
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800',
              )}
            >
              {tabOption.label}
              <span
                className={clsx(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-black',
                  tabOption.key === 'pending' && count > 0
                    ? 'bg-red-500 text-white'
                    : tab === tabOption.key
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-500',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative rounded border border-gray-200 bg-white p-3">
        <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="질문 내용, 작성자, 업소명, 답변 검색"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded border border-gray-300 py-2 pl-8 pr-3 text-sm outline-none focus:border-red-500"
        />
      </div>

      {error ? <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div> : null}

      <div className="space-y-3">
        {loading ? (
          <div className="rounded border border-gray-200 bg-white py-8 text-center text-sm text-gray-400">
            Q&A 목록을 불러오는 중입니다.
          </div>
        ) : null}

        {!loading && filtered.length === 0 ? (
          <div className="rounded border border-gray-200 bg-white py-8 text-center text-sm text-gray-400">
            {qnaList.length === 0 ? '표시할 Q&A가 없습니다.' : '해당 문의가 없습니다.'}
          </div>
        ) : null}

        {!loading &&
          filtered.map((qna) => {
            const threadComments = getThreadComments(qna);
            const isDone = qna.isAnswered || threadComments.length > 0;

            return (
              <div key={qna.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white text-sm shadow-sm">
                <div className="flex items-start gap-2 border-b border-gray-100 p-3">
                  <span
                    className={clsx(
                      'mt-0.5 flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black',
                      isDone ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600',
                    )}
                  >
                    {isDone ? (
                      <>
                        <CheckCircle className="h-3 w-3" /> 답변완료
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" /> 미완료
                      </>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="mb-1 font-semibold leading-snug text-gray-800">Q. {qna.question}</p>
                    <div className="flex flex-wrap gap-2 text-[11px] text-gray-400">
                      <span className="font-medium text-gray-600">{qna.authorName}</span>
                      <span>{formatDate(qna.createdAt)}</span>
                      {qna.shopId ? (
                        <span className="rounded bg-red-50 px-1.5 py-0.5 font-bold text-red-500">
                          {qna.shopName ?? '업소 지정 문의'}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-gray-50 p-3">
                  {threadComments.length > 0 ? (
                    <div className="space-y-2">
                      {threadComments.map((comment, index) => {
                        const isStaff = comment.authorRole === 'ADMIN' || comment.authorRole === 'OWNER' || !comment.authorRole;

                        return (
                          <div key={comment.id ?? `${qna.id}-comment-${index}`} className="rounded border border-green-100 bg-white p-2.5">
                            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-green-600">
                              <CheckCircle className="h-3.5 w-3.5" />
                              {comment.authorName ?? (isStaff ? '운영진' : '작성자')}
                              <span className="font-normal text-gray-400">
                                {comment.createdAt ? formatDate(comment.createdAt) : '등록됨'}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-700">A. {comment.content}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : activeComposerId === qna.id ? null : (
                    <div className="rounded border border-dashed border-gray-200 bg-white px-3 py-4 text-xs text-gray-400">
                      아직 등록된 답변이 없습니다.
                    </div>
                  )}

                  {activeComposerId === qna.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={drafts[qna.id] ?? ''}
                        onChange={(event) => setDrafts((current) => ({ ...current, [qna.id]: event.target.value }))}
                        placeholder="답변을 입력하세요"
                        className="w-full resize-none rounded border border-gray-300 px-3 py-2 text-xs outline-none focus:border-red-500"
                      />
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setActiveComposerId(null)}
                          className="rounded border border-gray-300 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-100"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => void handleCommentSubmit(qna.id)}
                          disabled={submittingId === qna.id}
                          className="flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Send className="h-3 w-3" />
                          {submittingId === qna.id ? '등록 중' : '등록'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveComposerId(qna.id)}
                      className="flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-gray-100"
                    >
                      <Send className="h-3 w-3" /> 답변 작성하기
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
