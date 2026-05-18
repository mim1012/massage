'use client';

import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Search, Star, Trash2, Pencil, Plus, X } from 'lucide-react';
import type { Review } from '@/lib/types';
import { formatDate } from '@/lib/utils';

type ManagedReview = Review & { shopRegionLabel?: string };

type Props = {
  scope: 'admin' | 'owner';
  initialReviews?: ManagedReview[];
  initialDataLoaded?: boolean;
};

const RATING_OPTIONS = [
  { value: 'all', label: '전체 평점' },
  { value: '5', label: '5점' },
  { value: '4', label: '4점' },
  { value: '3', label: '3점' },
  { value: '2', label: '2점' },
  { value: '1', label: '1점' },
] as const;

export default function ReviewManagementPage({ scope, initialReviews = [], initialDataLoaded = false }: Props) {
  const [reviews, setReviews] = useState<ManagedReview[]>(initialReviews);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialDataLoaded && initialReviews.length === 0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 등록/수정 모달 관련 상태
  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState<ManagedReview | null>(null);
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    shopId: '',
    authorName: '',
    rating: 5,
    content: '',
  });

  useEffect(() => {
    if (initialDataLoaded || initialReviews.length > 0) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/admin/reviews', { cache: 'no-store' });
        const result = (await response.json()) as { reviews?: ManagedReview[]; error?: string };
        if (!response.ok || !result.reviews) {
          throw new Error(result.error ?? '리뷰 목록을 불러오지 못했습니다.');
        }

        setReviews(result.reviews);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '리뷰 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [initialDataLoaded, initialReviews]);

  // 모달이 열릴 때 업소 목록 조회 (등록 모드일 때만)
  useEffect(() => {
    if (!showModal || editingReview || shops.length > 0) return;

    const loadShops = async () => {
      setShopsLoading(true);
      try {
        const response = await fetch('/api/admin/shops');
        const result = await response.json();
        if (response.ok && result.shops) {
          setShops(result.shops.map((s: any) => ({ id: s.id, name: s.name })));
        }
      } catch (e) {
        console.error('Failed to load shops', e);
      } finally {
        setShopsLoading(false);
      }
    };

    void loadShops();
  }, [showModal, editingReview, shops.length]);

  function handleOpenCreateModal() {
    setEditingReview(null);
    setForm({
      shopId: '',
      authorName: '',
      rating: 5,
      content: '',
    });
    setError(null);
    setShowModal(true);
  }

  function handleOpenEditModal(review: ManagedReview) {
    setEditingReview(review);
    setForm({
      shopId: review.shopId,
      authorName: review.authorName,
      rating: review.rating,
      content: review.content,
    });
    setError(null);
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setEditingReview(null);
    setForm({
      shopId: '',
      authorName: '',
      rating: 5,
      content: '',
    });
  }

  async function removeReview(id: string) {
    if (!window.confirm('정말로 이 후기를 삭제하시겠습니까?')) {
      return;
    }

    setDeletingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? '리뷰를 삭제하지 못했습니다.');
      }

      setReviews((current) => current.filter((review) => review.id !== id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '리뷰를 삭제하지 못했습니다.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingReview && !form.shopId) {
      setError('업소를 선택해주세요.');
      return;
    }
    if (!form.authorName.trim()) {
      setError('작성자 이름을 입력해주세요.');
      return;
    }
    if (!form.content.trim()) {
      setError('리뷰 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (editingReview) {
        const response = await fetch(`/api/admin/reviews/${editingReview.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authorName: form.authorName,
            rating: form.rating,
            content: form.content,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.review) {
          throw new Error(result.error ?? '리뷰를 수정하지 못했습니다.');
        }

        setReviews((current) =>
          current.map((r) => (r.id === editingReview.id ? { ...r, ...result.review } : r))
        );
        setShowModal(false);
        setEditingReview(null);
      } else {
        const response = await fetch('/api/admin/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopId: form.shopId,
            authorName: form.authorName,
            rating: form.rating,
            content: form.content,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.review) {
          throw new Error(result.error ?? '리뷰를 등록하지 못했습니다.');
        }

        setReviews((current) => [result.review, ...current]);
        setShowModal(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '요청 처리에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredReviews = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return reviews.filter((review) => {
      const matchesRating = ratingFilter === 'all' || review.rating === Number(ratingFilter);
      const matchesSearch =
        normalizedSearch.length === 0 ||
        review.authorName.toLowerCase().includes(normalizedSearch) ||
        review.shopName.toLowerCase().includes(normalizedSearch) ||
        review.content.toLowerCase().includes(normalizedSearch) ||
        (review.shopRegionLabel ?? '').toLowerCase().includes(normalizedSearch);

      return matchesRating && matchesSearch;
    });
  }, [ratingFilter, reviews, search]);

  const pageTitle = scope === 'admin' ? '리뷰 관리' : '내 업소 리뷰 관리';
  const scopeDescription =
    scope === 'admin'
      ? '관리자는 전체 리뷰를 등록, 수정, 삭제할 수 있습니다.'
      : '오너는 내 업소 리뷰를 조회, 등록, 수정, 삭제할 수 있습니다.';

  return (
    <div className="max-w-[900px] space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
          <MessageSquare className="h-5 w-5 text-red-600" />
          {pageTitle}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-700"
          >
            <Plus className="h-3.5 w-3.5" />
            리뷰 등록
          </button>
          <div className="rounded bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">
            검색 결과 {filteredReviews.length}건 / 전체 {reviews.length}건
          </div>
        </div>
      </div>

      <div className="rounded border border-[color-mix(in_srgb,var(--portal-brand)_20%,white)] bg-[var(--portal-brand-soft)] px-3 py-2 text-xs text-[var(--portal-brand-dark)]">
        리뷰를 직접 등록하거나 기존 리뷰를 수정 및 삭제하여 관리할 수 있습니다. {scopeDescription}
      </div>

      <div className="flex flex-col gap-2 rounded border border-gray-200 bg-white p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="업소명, 작성자, 지역, 내용 검색"
            className="w-full rounded border border-gray-300 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-red-500"
          />
        </div>
        <select
          value={ratingFilter}
          onChange={(event) => setRatingFilter(event.target.value)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-red-500"
        >
          {RATING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && !showModal ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="divide-y divide-gray-100 overflow-hidden rounded border border-gray-200 bg-white">
        {loading ? <div className="p-6 text-center text-sm text-gray-400">리뷰 목록을 불러오는 중입니다.</div> : null}
        {!loading &&
          filteredReviews.map((review) => (
            <div key={review.id} className="flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-gray-800">{review.authorName}</span>
                  <span className="text-xs text-red-500">{review.shopName}</span>
                  {review.shopRegionLabel ? (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">
                      {review.shopRegionLabel}
                    </span>
                  ) : null}
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <Star
                        key={score}
                        className={`h-3 w-3 ${
                          score <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-auto text-[11px] text-gray-400">{formatDate(review.createdAt)}</span>
                </div>
                <p className="text-sm leading-relaxed text-gray-600">{review.content}</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleOpenEditModal(review)}
                  className="rounded border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  title="수정"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => void removeReview(review.id)}
                  disabled={deletingId === review.id}
                  className="rounded border border-red-200 p-1.5 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  title="삭제"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        {!loading && filteredReviews.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">
            {reviews.length === 0
              ? scope === 'owner'
                ? '아직 내 업소에 등록된 리뷰가 없습니다. 고객 리뷰가 생기면 이곳에서 바로 관리할 수 있습니다.'
                : '등록된 리뷰가 없습니다.'
              : '검색 조건에 맞는 리뷰가 없습니다. 검색어 또는 평점 필터를 다시 확인해 주세요.'}
          </div>
        ) : null}
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-black text-gray-800">
                {editingReview ? '리뷰 수정' : '리뷰 등록'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error ? (
              <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            ) : null}

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">
                  대상 업소 <span className="text-red-500">*</span>
                </label>
                {editingReview ? (
                  <input
                    type="text"
                    value={editingReview.shopName}
                    readOnly
                    className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm text-gray-500 outline-none"
                  />
                ) : (
                  <select
                    value={form.shopId}
                    onChange={(e) => setForm((c) => ({ ...c, shopId: e.target.value }))}
                    disabled={shopsLoading}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-red-500 disabled:opacity-60"
                  >
                    <option value="">업소를 선택해주세요</option>
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">
                  작성자 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.authorName}
                  onChange={(e) => setForm((c) => ({ ...c, authorName: e.target.value }))}
                  placeholder="작성자 닉네임 또는 이름"
                  className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">
                  평점 <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.rating}
                  onChange={(e) => setForm((c) => ({ ...c, rating: Number(e.target.value) }))}
                  className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-red-500"
                >
                  <option value={5}>⭐ 5점</option>
                  <option value={4}>⭐ 4점</option>
                  <option value={3}>⭐ 3점</option>
                  <option value={2}>⭐ 2점</option>
                  <option value={1}>⭐ 1점</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">
                  리뷰 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={form.content}
                  onChange={(e) => setForm((c) => ({ ...c, content: e.target.value }))}
                  placeholder="리뷰 내용을 성실히 남겨주세요."
                  className="w-full resize-none rounded border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-red-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 rounded bg-gray-100 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded bg-red-600 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
