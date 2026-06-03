'use client';

import { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, X, Save } from 'lucide-react';

interface ThemeItem {
  code: string;
  label: string;
  emoji: string;
}

export default function AdminThemesPage() {
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', label: '', emoji: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/themes')
      .then(r => r.json())
      .then(({ themes: data }: { themes: ThemeItem[] }) => setThemes(data ?? []));
  }, []);

  const openNew = () => {
    setForm({ code: '', label: '', emoji: '' });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/admin/themes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const { theme } = await res.json() as { theme: ThemeItem };
      setThemes(prev => [...prev, theme]);
      setShowForm(false);
    } else {
      const { error: msg } = await res.json() as { error: string };
      setError(msg ?? '오류가 발생했습니다.');
    }
  };

  const handleDelete = async (code: string) => {
    const res = await fetch('/api/admin/themes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (res.ok) setThemes(prev => prev.filter(t => t.code !== code));
  };

  return (
    <div className="max-w-[700px] space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <Tag className="w-5 h-5 text-red-600" /> 테마 관리
        </h1>
        <button
          onClick={openNew}
          className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> 테마 추가
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-red-300 rounded p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
            <h2 className="text-sm font-bold text-gray-800">새 테마 추가</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">코드 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                  placeholder="예: shiatsu"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">이름 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.label}
                  onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                  placeholder="예: 시아쓰"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">이모지</label>
                <input
                  type="text"
                  value={form.emoji}
                  onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))}
                  placeholder="예: 🌟"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-red-500 outline-none"
                />
              </div>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex justify-end">
              <button type="submit" className="flex items-center gap-1 px-4 py-1.5 bg-red-600 text-white text-sm font-bold rounded hover:bg-red-700">
                <Save className="w-4 h-4" /> 저장
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="divide-y divide-gray-100">
          {themes.map(theme => (
            <div key={theme.code} className="p-3 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl w-7 text-center shrink-0">{theme.emoji}</span>
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-gray-800">{theme.label}</span>
                  <span className="ml-2 text-xs text-gray-400 font-mono">{theme.code}</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(theme.code)}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded border border-red-100 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {themes.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-400">등록된 테마가 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
