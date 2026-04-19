'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, MessageCircle, Send } from 'lucide-react';
import clsx from 'clsx';
import type { QnA } from '@/lib/types';
import { formatDate } from '@/lib/utils';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'done', label: 'Answered' },
] satisfies Array<{ key: 'all' | 'pending' | 'done'; label: string }>;

export default function AdminQnAPage() {
  const [qnaList, setQnaList] = useState<QnA[]>([]);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [tab, setTab] = useState<'all' | 'pending' | 'done'>('all');

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/board/qna', { cache: 'no-store' });
      const result = (await response.json()) as { qna?: QnA[] };
      if (response.ok) {
        setQnaList(result.qna ?? []);
      }
    };

    void load();
  }, []);

  const filtered = qnaList.filter((qna) =>
    tab === 'pending' ? !qna.isAnswered : tab === 'done' ? qna.isAnswered : true,
  );

  const handleAnswer = async (id: string) => {
    const trimmedAnswer = answerText.trim();
    if (!trimmedAnswer) {
      return;
    }

    const response = await fetch(`/api/admin/qna/${id}/answer`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: trimmedAnswer }),
    });
    const result = (await response.json()) as { qna?: QnA };
    if (!response.ok || !result.qna) {
      return;
    }

    setQnaList((current) => current.map((qna) => (qna.id === id ? result.qna! : qna)));
    setAnsweringId(null);
    setAnswerText('');
  };

  return (
    <div className="max-w-[800px] space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
        <MessageCircle className="h-5 w-5 text-red-600" />
        Q&amp;A Reply Management
      </h1>

      <div className="mb-4 flex gap-2 border-b border-gray-200">
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

      <div className="space-y-3">
        {filtered.map((qna) => (
          <div key={qna.id} className="rounded border border-gray-200 bg-white text-sm shadow-sm">
            <div className="flex items-start gap-2 border-b border-gray-100 p-3">
              <span
                className={clsx(
                  'mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold',
                  qna.isAnswered ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600',
                )}
              >
                {qna.isAnswered ? 'Done' : 'Open'}
              </span>
              <div className="flex-1">
                <p className="mb-1 font-semibold leading-snug text-gray-800">Q. {qna.question}</p>
                <div className="flex gap-2 text-[11px] text-gray-400">
                  <span>{qna.authorName}</span>
                  <span>{formatDate(qna.createdAt)}</span>
                  {qna.shopId ? (
                    <span className="rounded bg-red-50 px-1 font-bold text-red-500">Shop</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-b bg-gray-50 p-3">
              {qna.answer ? (
                <div className="text-gray-700">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-green-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Answer
                  </div>
                  <p className="text-xs leading-relaxed">A. {qna.answer}</p>
                </div>
              ) : answeringId === qna.id ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={answerText}
                    onChange={(event) => setAnswerText(event.target.value)}
                    placeholder="Type an answer"
                    className="w-full resize-none rounded border border-gray-300 px-3 py-2 text-xs outline-none focus:border-red-500"
                  />
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => setAnsweringId(null)}
                      className="rounded border border-gray-300 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => void handleAnswer(qna.id)}
                      className="rounded bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-red-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAnsweringId(qna.id);
                    setAnswerText('');
                  }}
                  className="flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-gray-100"
                >
                  <Send className="h-3 w-3" />
                  Write answer
                </button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 ? (
          <div className="rounded border border-gray-200 bg-white py-8 text-center text-sm text-gray-400">
            No questions in this tab.
          </div>
        ) : null}
      </div>
    </div>
  );
}
