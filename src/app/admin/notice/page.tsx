'use client';

import { useEffect, useState } from 'react';
import { Bell, Edit2, Pin, Plus, Save, Trash2, X } from 'lucide-react';
import type { Notice } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function AdminNoticePage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [form, setForm] = useState({ title: '', content: '', isPinned: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadNotices();
  }, []);

  async function loadNotices() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/notices', { cache: 'no-store' });
      const result = (await response.json()) as { notices?: Notice[]; error?: string };
      if (!response.ok || !result.notices) {
        throw new Error(result.error ?? '공지 목록을 불러오지 못했습니다.');
      }

      setNotices(result.notices);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '공지 목록을 불러오지 못했습니다.');
      console.error(loadError);
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditing(null);
    setForm({ title: '', content: '', isPinned: false });
    setShowForm(true);
    setError(null);
  }

  function openEdit(notice: Notice) {
    setEditing(notice);
    setForm({ title: notice.title, content: notice.content, isPinned: notice.isPinned });
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(editing ? `/api/admin/notices/${editing.id}` : '/api/admin/notices', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const result = response.status === 204 ? {} : ((await response.json()) as { error?: string });
      if (!response.ok) {
        throw new Error(result.error ?? '공지를 저장하지 못했습니다.');
      }

      await loadNotices();
      setShowForm(false);
      setEditing(null);
      setForm({ title: '', content: '', isPinned: false });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '공지를 저장하지 못했습니다.');
      console.error(saveError);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);

    try {
      const response = await fetch(`/api/admin/notices/${id}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? '공지를 삭제하지 못했습니다.');
      }

      setNotices((current) => current.filter((notice) => notice.id !== id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '공지를 삭제하지 못했습니다.');
      console.error(deleteError);
    }
  }

  return (
    <div className="max-w-[800px] space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
          <Bell className="h-5 w-5 text-red-600" />
          공지사항 관리
        </h1>
        <button
          onClick={openNew}
          className="flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          공지 작성
        </button>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="rounded border border-red-300 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="text-sm font-bold text-gray-800">{editing ? '공지 수정' : '새 공지 작성'}</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              required
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="공지 제목"
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-red-500"
            />
            <textarea
              required
              rows={4}
              value={form.content}
              onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
              placeholder="내용"
              className="w-full resize-none rounded border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-red-500"
            />
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(event) => setForm((current) => ({ ...current, isPinned: event.target.checked }))}
                  className="accent-red-600"
                />
                <Pin className="h-3.5 w-3.5 text-red-500" />
                상단 고정
              </label>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1 rounded bg-red-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? '저장 중' : '저장'}
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {error ? <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div> : null}

      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        {loading ? (
          <div className="p-6 text-center text-sm text-gray-400">공지 목록을 불러오는 중입니다.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notices.map((notice) => (
              <div key={notice.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                <div className="flex min-w-0 items-center gap-2">
                  {notice.isPinned ? (
                    <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                      고정
                    </span>
                  ) : null}
                  <span className="truncate text-sm font-semibold text-gray-800">{notice.title}</span>
                  <span className="ml-2 shrink-0 text-[11px] text-gray-400">{formatDate(notice.createdAt)}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => openEdit(notice)}
                    className="rounded border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-200"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => void handleDelete(notice.id)}
                    className="rounded border border-red-100 p-1.5 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {notices.length === 0 ? <div className="p-6 text-center text-sm text-gray-400">등록된 공지가 없습니다.</div> : null}
          </div>
        )}
      </div>
    </div>
  );
}
