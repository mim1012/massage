'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { CheckCircle, MessageCircle, Search, Send } from 'lucide-react';
import type { AdminShopListItem } from '@/lib/communityTypes';
import type { QnA, QnAComment } from '@/lib/types';
import { formatDate } from '@/lib/utils';

type Props = {
  scope: 'admin' | 'owner';
  initialQnaList?: QnA[];
  initialShops?: AdminShopListItem[];
  initialDataLoaded?: boolean;
};

type TabKey = 'all' | 'pending' | 'done';

type SessionUser = {
  id: string;
  role: 'ADMIN' | 'OWNER' | 'USER';
};

const TABS = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '대기' },
  { key: 'done', label: '댓글 등록됨' },
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

export default function QnaManagementPage({ scope, initialQnaList = [], initialShops = [], initialDataLoaded = false }: Props) {
  const [qnaList, setQnaList] = useState<QnA[]>(initialQnaList);
  const [shops, setShops] = useState<AdminShopListItem[]>(initialShops);
  const [tab, setTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [activeComposerId, setActiveComposerId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(!initialDataLoaded && initialQnaList.length === 0 && initialShops.length === 0);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialDataLoaded || initialQnaList.length > 0 || initialShops.length > 0) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        let ownedShopIds: string[] | null = null;

        if (scope === 'owner') {
          const [meResponse, shopsResponse] = await Promise.all([
            fetch('/api/auth/me', { cache: 'no-store' }),
            fetch('/api/admin/shops', { cache: 'no-store' }),
          ]);

          const meResult = (await meResponse.json()) as { user?: SessionUser | null };
          const shopsResult = (await shopsResponse.json()) as { shops?: AdminShopListItem[]; error?: string };

          if (!meResponse.ok || !meResult.user || meResult.user.role !== 'OWNER') {
            throw new Error('오너 계정 정보를 불러오지 못했습니다.');
          }

          if (!shopsResponse.ok || !shopsResult.shops) {
            throw new Error(shopsResult.error ?? '내 업소 정보를 불러오지 못했습니다.');
          }

          setShops(shopsResult.shops);
          ownedShopIds = shopsResult.shops.map((shop) => shop.id);
        }

        const response = await fetch('/api/board/qna', { cache: 'no-store' });
        const result = (await response.json()) as { qna?: QnA[]; error?: string };
        if (!response.ok || !result.qna) {
          throw new Error(result.error ?? 'Q&A 목록을 불러오지 못했습니다.');
        }

        const scopedQna =
          scope === 'owner' && ownedShopIds
            ? result.qna.filter((entry) => Boolean(entry.shopId && ownedShopIds.includes(entry.shopId)))
            : result.qna;

        setQnaList(scopedQna);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Q&A 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [initialDataLoaded, initialQnaList, initialShops, scope]);

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

  const pageTitle = scope === 'admin' ? 'Q&A 댓글 관리' : '내 업소 Q&A 댓글 관리';
  const description =
    scope === 'admin'
      ? '관리자는 전체 Q&A를 검색하고 댓글 스레드를 관리할 수 있습니다.'
      : '오너는 내 업소 Q&A만 검색하고 댓글 스레드를 관리할 수 있습니다.';

  return (
    <div className="max-w-[900px] space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
          <MessageCircle className="h-5 w-5 text-red-600" />
          {pageTitle}
        </h1>
        <div className="rounded bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">검색 결과 {filtered.length}건 / 전체 {qnaList.length}건</div>
      </div>

      <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
        {description} 여러 댓글이 제공되면 스레드 형태로 표시되며, 기존 단일 답변 데이터도 함께 호환됩니다.
      </div>

      <div className="mb-1 flex gap-2 border-b border-gray-200">
        {TABS.map((tabOption) => (
          <button
            key={tabOption.key}
            onClick={() => setTab(tabOption.key)}
            className={clsx(
              'border-b-2 px-4 py-2 text-sm font-bold',
              tab === tabOption.key
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-800',
            )}
          >
            {tabOption.label}
          </button>
        ))}
      </div>

      <div className="relative rounded border border-gray-200 bg-white p-3">
        <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="질문, 작성자, 업소명, 댓글 내용 검색"
          className="w-full rounded border border-gray-300 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-red-500"
        />
      </div>

      {error ? <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div> : null}

      <div className="space-y-3">
        {loading ? (
          <div className="rounded border border-gray-200 bg-white py-8 text-center text-sm text-gray-400">Q&A 목록을 불러오는 중입니다.</div>
        ) : null}

        {!loading &&
          filtered.map((qna) => {
            const threadComments = getThreadComments(qna);
            const isDone = qna.isAnswered || threadComments.length > 0;
            const shopName = qna.shopName ?? (qna.shopId ? '업소 문의' : '일반 문의');
            const shopMeta = qna.shopRegionLabel ? `${shopName} · ${qna.shopRegionLabel}` : shopName;

            return (
              <div key={qna.id} className="rounded border border-gray-200 bg-white text-sm shadow-sm">
                <div className="flex items-start gap-2 border-b border-gray-100 p-3">
                  <span
                    className={clsx(
                      'mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold',
                      isDone ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600',
                    )}
                  >
                    {isDone ? '완료' : '대기'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 font-semibold leading-snug text-gray-800">Q. {qna.question}</p>
                    <div className="flex flex-wrap gap-2 text-[11px] text-gray-400">
                      <span>{qna.authorName}</span>
                      <span>{formatDate(qna.createdAt)}</span>
                      <span className="rounded bg-red-50 px-1 font-bold text-red-500">{shopMeta}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-b bg-gray-50 p-3">
                  {threadComments.length > 0 ? (
                    <div className="space-y-2">
                      {threadComments.map((comment, index) => {
                        const isStaff = comment.authorRole === 'ADMIN' || comment.authorRole === 'OWNER' || !comment.authorRole;
                        return (
                          <div key={comment.id ?? `${qna.id}-comment-${index}`} className="rounded border border-gray-200 bg-white p-3">
                            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-green-600">
                              <CheckCircle className="h-3.5 w-3.5" />
                              {comment.authorName ?? (isStaff ? '운영진' : '작성자')}
                              <span className="font-normal text-gray-400">
                                {comment.createdAt ? formatDate(comment.createdAt) : '등록됨'}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-700">{comment.content}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded border border-dashed border-gray-200 bg-white px-3 py-4 text-xs text-gray-400">
                      아직 등록된 운영 댓글이 없습니다.
                    </div>
                  )}

                  {activeComposerId === qna.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={drafts[qna.id] ?? ''}
                        onChange={(event) => setDrafts((current) => ({ ...current, [qna.id]: event.target.value }))}
                        placeholder="댓글 내용을 입력해 주세요."
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
                          className="rounded bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {submittingId === qna.id ? '저장 중' : '저장'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveComposerId(qna.id)}
                      className="flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-gray-100"
                    >
                      <Send className="h-3 w-3" />
                      댓글 추가
                    </button>
                  )}
                </div>
              </div>
            );
          })}

        {!loading && filtered.length === 0 ? (
          <div className="rounded border border-gray-200 bg-white py-8 text-center text-sm text-gray-400">
            {qnaList.length === 0
              ? scope === 'owner' && shops.length === 0
                ? '관리 가능한 업소가 없습니다. 먼저 내 업소를 등록하거나 관리자 승인 상태를 확인해 주세요.'
                : scope === 'owner'
                  ? '아직 내 업소에 등록된 Q&A가 없습니다. 고객 문의가 생기면 이곳에서 바로 댓글을 관리할 수 있습니다.'
                  : '표시할 Q&A가 없습니다.'
              : '검색 조건에 맞는 Q&A가 없습니다. 검색어 또는 상태 탭을 다시 확인해 주세요.'}
          </div>
        ) : null}
      </div>
    </div>
  );
}
