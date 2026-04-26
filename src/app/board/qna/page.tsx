'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronRight, ChevronUp, Plus, X } from 'lucide-react';
import type { QnA, QnAComment, User } from '@/lib/types';
import { formatDate } from '@/lib/utils';

function getPrimaryAnswer(entry: QnA) {
  const sortedComments = [...(entry.comments ?? [])]
    .filter((comment): comment is QnAComment & { content: string } => Boolean(comment?.content?.trim()))
    .sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return leftTime - rightTime;
    });

  const latestComment = sortedComments.at(-1);
  if (latestComment?.content?.trim()) {
    return latestComment.content.trim();
  }

  return entry.answer?.trim() || null;
}

function QnaContent() {
  const searchParams = useSearchParams();
  const shopId = searchParams.get('shopId');
  const query = searchParams.get('q')?.trim() ?? '';

  const [entries, setEntries] = useState<QnA[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    void loadQna(shopId, query);
  }, [query, shopId]);

  const filteredEntries = useMemo(() => {
    const normalized = query.toLowerCase();
    if (!normalized) {
      return entries;
    }

    return entries.filter((entry) => {
      const primaryAnswer = getPrimaryAnswer(entry) ?? '';
      return [entry.question, entry.authorName, primaryAnswer].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [entries, query]);

  async function loadQna(currentShopId: string | null, currentQuery: string) {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (currentShopId) params.set('shopId', currentShopId);
      if (currentQuery) params.set('q', currentQuery);

      const [meResponse, qnaResponse] = await Promise.all([
        fetch('/api/auth/me', { cache: 'no-store' }),
        fetch(`/api/board/qna${params.toString() ? `?${params.toString()}` : ''}`, { cache: 'no-store' }),
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
      await loadQna(shopId, query);
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

      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-black text-gray-800">💬 Q&amp;A</h1>
        <button
          onClick={() => {
            setError(null);
            setShowForm((current) => !current);
          }}
          className="flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
        >
          {showForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {showForm ? '취소' : '질문 작성'}
        </button>
      </div>

      {showForm ? (
        !authChecked ? null : !user ? (
          <div className="mb-3 rounded border border-gray-200 bg-white p-4 text-center">
            <p className="text-sm font-bold text-gray-800">질문 작성은 로그인한 회원만 가능합니다.</p>
            <div className="mt-3 flex justify-center gap-2">
              <Link href="/auth/login" className="rounded bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">
                로그인
              </Link>
              <Link
                href="/auth/register"
                className="rounded border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:border-red-300 hover:text-red-600"
              >
                회원가입
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mb-3 space-y-3 rounded border border-red-200 bg-white p-4">
            <input
              type="text"
              value={user.name}
              readOnly
              className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 outline-none"
            />
            <textarea
              required
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="질문 내용을 입력하세요"
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
          </form>
        )
      ) : null}

      {submitted ? <div className="mb-3 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">✅ 질문이 등록되었습니다.</div> : null}
      {error ? <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div> : null}

      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        {loading ? (
          <p className="py-8 text-center text-sm text-gray-400">Q&amp;A 목록을 불러오는 중입니다.</p>
        ) : filteredEntries.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            {query ? '검색 조건에 맞는 Q&A가 없습니다.' : '등록된 Q&A가 없습니다.'}
          </p>
        ) : (
          filteredEntries.map((entry, idx) => {
            const answer = getPrimaryAnswer(entry);
            return (
              <div key={entry.id} className={idx < filteredEntries.length - 1 ? 'border-b border-gray-100' : ''}>
                <button
                  onClick={() => setOpenId(openId === entry.id ? null : entry.id)}
                  className="w-full text-left transition-all hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between p-3">
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
                        </p>
                      </div>
                    </div>
                    {openId === entry.id ? (
                      <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
                    ) : (
                      <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
                    )}
                  </div>
                </button>

                {openId === entry.id ? (
                  <div className="px-3 pb-3">
                    {answer ? (
                      <div className="rounded border border-red-100 bg-red-50 p-3 text-sm text-gray-700">
                        <p className="mb-1 text-[11px] font-bold text-red-500">관리자 답변</p>
                        A. {answer}
                      </div>
                    ) : (
                      <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">답변 준비 중입니다.</div>
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