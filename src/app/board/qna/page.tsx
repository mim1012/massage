'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronRight, ChevronUp, MessageSquare, Plus, Search, X } from 'lucide-react';
import type { QnA, QnAComment, User } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface ThreadComment {
  id: string;
  content: string;
  authorName: string;
  authorRole?: string;
  createdAt?: string;
}

function getRoleBadge(role?: string) {
  switch (role) {
    case 'ADMIN':
      return { label: '관리자', className: 'bg-red-100 text-red-600' };
    case 'OWNER':
      return { label: '업주', className: 'bg-amber-100 text-amber-700' };
    case 'OPERATOR':
    case 'STAFF':
    case 'MANAGER':
      return { label: '운영팀', className: 'bg-red-100 text-red-600' };
    default:
      return null;
  }
}

function normalizeComments(entry: QnA): ThreadComment[] {
  const mappedComments = (entry.comments ?? [])
    .filter((comment): comment is QnAComment & { content: string } => Boolean(comment?.content?.trim()))
    .map((comment, index) => ({
      id: comment.id ?? `${entry.id}-comment-${index}`,
      content: comment.content,
      authorName: comment.authorName?.trim() || '운영자',
      authorRole: comment.authorRole,
      createdAt: comment.createdAt,
    }));

  if (mappedComments.length > 0) {
    return [...mappedComments].sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return leftTime - rightTime;
    });
  }

  if (!entry.answer) {
    return [];
  }

  return [
    {
      id: `${entry.id}-answer`,
      content: entry.answer,
      authorName: '운영자',
      createdAt: entry.createdAt,
    },
  ];
}

function matchesKeyword(entry: QnA, query: string) {
  if (!query) {
    return true;
  }

  const threadComments = normalizeComments(entry);
  return [
    entry.question,
    entry.answer ?? '',
    entry.authorName,
    ...threadComments.flatMap((comment) => [comment.authorName, comment.content]),
  ].some((value) => value.toLowerCase().includes(query));
}

function QnaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const shopId = searchParams.get('shopId');
  const initialKeyword = searchParams.get('q') ?? '';
  const [entries, setEntries] = useState<QnA[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [keyword, setKeyword] = useState(initialKeyword);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setKeyword(initialKeyword);
  }, [initialKeyword]);

  useEffect(() => {
    void loadQna(shopId, initialKeyword);
  }, [initialKeyword, shopId]);

  const pageTitle = useMemo(() => (shopId ? '업소 Q&A' : 'Q&A'), [shopId]);

  const filteredEntries = useMemo(() => {
    const query = initialKeyword.trim().toLowerCase();
    return entries.filter((entry) => matchesKeyword(entry, query));
  }, [entries, initialKeyword]);

  async function loadQna(currentShopId: string | null, currentKeyword: string) {
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams();
      if (currentShopId) query.set('shopId', currentShopId);
      if (currentKeyword.trim()) query.set('q', currentKeyword.trim());

      const [meResponse, qnaResponse] = await Promise.all([
        fetch('/api/auth/me', { cache: 'no-store' }),
        fetch(`/api/board/qna${query.toString() ? `?${query.toString()}` : ''}`, { cache: 'no-store' }),
      ]);

      if (meResponse.ok) {
        const meResult = (await meResponse.json()) as { user?: User };
        setUser(meResult.user ?? null);
      } else {
        setUser(null);
      }

      const result = (await qnaResponse.json()) as { qna?: QnA[]; error?: string };
      if (!qnaResponse.ok || !result.qna) {
        throw new Error(result.error ?? 'Q&A 목록을 불러오지 못했습니다.');
      }

      setEntries(result.qna);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Q&A 목록을 불러오지 못했습니다.');
      console.error(loadError);
    } finally {
      setAuthChecked(true);
      setLoading(false);
    }
  }

  function updateQuery(nextKeyword: string) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = nextKeyword.trim();

    if (trimmed) {
      params.set('q', trimmed);
    } else {
      params.delete('q');
    }

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateQuery(keyword);
  }

  function handleSearchReset() {
    setKeyword('');
    updateQuery('');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setError('로그인한 회원만 질문을 작성할 수 있습니다.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSubmitted(false);

    try {
      const response = await fetch('/api/board/qna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, shopId }),
      });
      const result = (await response.json()) as { qna?: QnA; error?: string };
      if (!response.ok || !result.qna) {
        throw new Error(result.error ?? 'Q&A를 등록하지 못했습니다.');
      }

      setQuestion('');
      setShowForm(false);
      setSubmitted(true);
      await loadQna(shopId, initialKeyword);
      setOpenId(result.qna.id);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '질문을 등록하지 못했습니다.');
      console.error(submitError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[800px] px-3 py-4">
      <div className="mb-3 flex items-center gap-1 text-xs text-gray-500">
        <Link href="/" className="hover:text-red-600">
          홈
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/board" className="hover:text-red-600">
          게시판
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-800">Q&amp;A</span>
      </div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-lg font-black text-gray-800">{pageTitle}</h1>
        <button
          onClick={() => setShowForm((current) => !current)}
          className="flex shrink-0 items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
        >
          {showForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {showForm ? '취소' : '질문 작성'}
        </button>
      </div>

      {showForm ? (
        !authChecked ? null : !user ? (
          <div className="mb-3 space-y-3 rounded border border-gray-200 bg-white p-4 text-center">
            <p className="text-sm font-bold text-gray-800">질문 작성은 로그인한 회원만 가능합니다.</p>
            <div className="flex justify-center gap-2">
              <Link href="/auth/login" className="rounded bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">
                로그인
              </Link>
              <Link href="/auth/register" className="rounded border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:border-red-300 hover:text-red-600">
                회원가입
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mb-3 space-y-3 rounded border border-red-200 bg-white p-4">
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">작성자: {user.name}</div>
            <textarea
              required
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="질문 내용을 입력해 주세요."
              rows={3}
              className="w-full resize-none rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded bg-red-600 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? '등록 중' : '등록'}
            </button>
            <p className="text-[11px] text-gray-400">로그인한 회원은 누구나 질문을 작성할 수 있습니다.</p>
          </form>
        )
      ) : null}

      {submitted ? (
        <div className="mb-3 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          질문이 등록되었습니다.
        </div>
      ) : null}
      {error ? <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div> : null}

      <form onSubmit={handleSearchSubmit} className="mb-3 rounded border border-gray-200 bg-white p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="질문, 댓글, 작성자로 검색"
              className="w-full rounded border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-red-500"
            />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="rounded bg-gray-800 px-4 py-2 text-sm font-bold text-white hover:bg-black">
              검색
            </button>
            {initialKeyword ? (
              <button
                type="button"
                onClick={handleSearchReset}
                className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-2 text-sm font-bold text-gray-600 hover:border-red-300 hover:text-red-600"
              >
                <X className="h-3.5 w-3.5" />
                초기화
              </button>
            ) : null}
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          총 {filteredEntries.length}개의 질문
          {initialKeyword ? <span> · “{initialKeyword}” 검색 결과</span> : null}
        </p>
      </form>

      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        {loading ? (
          <p className="py-8 text-center text-sm text-gray-400">Q&amp;A 목록을 불러오는 중입니다.</p>
        ) : filteredEntries.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            {initialKeyword ? '검색 조건에 맞는 Q&A가 없습니다.' : '등록된 Q&A가 없습니다.'}
          </p>
        ) : (
          filteredEntries.map((entry, index) => {
            const threadComments = normalizeComments(entry);

            return (
              <div key={entry.id} className={index < filteredEntries.length - 1 ? 'border-b border-gray-100' : ''}>
                <button
                  onClick={() => setOpenId((current) => (current === entry.id ? null : entry.id))}
                  className="flex w-full items-start justify-between p-3 text-left transition-all hover:bg-gray-50"
                >
                  <div className="flex min-w-0 items-start gap-2">
                    <span
                      className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        entry.isAnswered ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {entry.isAnswered ? '완료' : '대기'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700">Q. {entry.question}</p>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {entry.authorName} · {formatDate(entry.createdAt)}
                        {threadComments.length > 0 ? <span> · 댓글 {threadComments.length}개</span> : null}
                      </p>
                    </div>
                  </div>
                  {openId === entry.id ? (
                    <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
                  ) : (
                    <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
                  )}
                </button>
                {openId === entry.id ? (
                  <div className="space-y-2 px-3 pb-3">
                    <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                      <p className="mb-1 text-[11px] font-bold text-gray-500">질문 내용</p>
                      {entry.question}
                    </div>

                    {threadComments.length > 0 ? (
                      <div className="space-y-2">
                        {threadComments.map((comment) => {
                          const roleBadge = getRoleBadge(comment.authorRole);

                          return (
                            <div key={comment.id} className="rounded border border-red-100 bg-red-50 p-3 text-sm text-gray-700">
                              <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px]">
                                <div className="flex items-center gap-1.5 font-bold text-gray-700">
                                  <MessageSquare className="h-3.5 w-3.5 text-red-500" />
                                  <span>{comment.authorName}</span>
                                </div>
                                {roleBadge ? (
                                  <span className={`rounded px-1.5 py-0.5 font-bold ${roleBadge.className}`}>{roleBadge.label}</span>
                                ) : null}
                                {comment.createdAt ? <span className="text-gray-400">{formatDate(comment.createdAt)}</span> : null}
                              </div>
                              <p className="leading-relaxed">{comment.content}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                        아직 등록된 댓글이 없습니다.
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function QnaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <QnaContent />
    </Suspense>
  );
}
