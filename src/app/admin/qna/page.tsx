'use client';

import { useState } from 'react';
import { MessageCircle, Send, CheckCircle, Clock, Search } from 'lucide-react';
import { MOCK_QNA } from '@/lib/mockData';
import { QnA } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import clsx from 'clsx';

export default function AdminQnAPage() {
  const [qnaList, setQnaList] = useState<QnA[]>(MOCK_QNA);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [tab, setTab] = useState<'all' | 'pending' | 'done'>('all');
  const [search, setSearch] = useState('');

  const pendingCount = qnaList.filter(q => !q.isAnswered).length;
  const doneCount = qnaList.filter(q => q.isAnswered).length;

  const filtered = qnaList.filter(q => {
    const matchTab = tab === 'pending' ? !q.isAnswered : tab === 'done' ? q.isAnswered : true;
    const matchSearch = !search || q.question.includes(search) || q.authorName.includes(search);
    return matchTab && matchSearch;
  });

  const handleAnswer = (id: string) => {
    if (!answerText.trim()) return;
    setQnaList(prev => prev.map(q => q.id === id ? { ...q, answer: answerText, isAnswered: true } : q));
    setAnsweringId(null);
    setAnswerText('');
  };

  return (
    <div className="max-w-[800px] space-y-4">
      <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-red-600" /> Q&A 답변 관리
      </h1>

      {/* 탭 + 카운트 */}
      <div className="flex gap-0 border-b border-gray-200">
        {[
          { key: 'all', label: '전체', count: qnaList.length },
          { key: 'pending', label: '미완료', count: pendingCount },
          { key: 'done', label: '답변완료', count: doneCount },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={clsx(
              'px-4 py-2.5 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors',
              tab === t.key ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-800'
            )}>
            {t.label}
            <span className={clsx(
              'text-[10px] font-black px-1.5 py-0.5 rounded-full',
              t.key === 'pending' && t.count > 0
                ? 'bg-red-500 text-white'
                : tab === t.key ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
            )}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="질문 내용, 작성자 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded focus:border-red-500 outline-none bg-white"
        />
      </div>

      {/* Q&A 목록 */}
      <div className="space-y-3">
        {filtered.map(qna => (
          <div key={qna.id} className="bg-white border border-gray-200 rounded-lg text-sm shadow-sm overflow-hidden">
            {/* 질문 헤더 */}
            <div className="p-3 border-b border-gray-100 flex items-start gap-2">
              {/* 상태 배지 */}
              <span className={clsx(
                'shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black mt-0.5',
                qna.isAnswered
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-600'
              )}>
                {qna.isAnswered
                  ? <><CheckCircle className="w-3 h-3" /> 답변완료</>
                  : <><Clock className="w-3 h-3" /> 미완료</>
                }
              </span>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 mb-1 leading-snug">Q. {qna.question}</p>
                <div className="flex gap-2 text-[11px] text-gray-400 flex-wrap">
                  <span className="font-medium text-gray-600">{qna.authorName}</span>
                  <span>{formatDate(qna.createdAt)}</span>
                  {qna.shopId && (
                    <span className="text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded">업소 지정 문의</span>
                  )}
                </div>
              </div>
            </div>

            {/* 답변 영역 */}
            <div className="p-3 bg-gray-50 rounded-b">
              {qna.answer ? (
                <div className="text-gray-700">
                  <div className="flex items-center gap-1.5 mb-1.5 text-green-600 font-bold text-[11px]">
                    <CheckCircle className="w-3.5 h-3.5" /> 답변 완료
                  </div>
                  <p className="text-xs leading-relaxed bg-white border border-green-100 rounded p-2.5">A. {qna.answer}</p>
                </div>
              ) : answeringId === qna.id ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={answerText}
                    onChange={e => setAnswerText(e.target.value)}
                    placeholder="답변을 입력하세요"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-red-500 outline-none resize-none"
                  />
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => setAnsweringId(null)} className="px-3 py-1.5 border border-gray-300 text-gray-600 text-[11px] rounded hover:bg-gray-100">취소</button>
                    <button onClick={() => handleAnswer(qna.id)} className="px-3 py-1.5 bg-red-600 text-white text-[11px] font-bold rounded hover:bg-red-700 flex items-center gap-1">
                      <Send className="w-3 h-3" /> 등록
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setAnsweringId(qna.id); setAnswerText(''); }}
                  className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-[11px] font-bold rounded hover:bg-gray-100 flex items-center gap-1"
                >
                  <Send className="w-3 h-3" /> 답변 작성하기
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm border bg-white rounded border-gray-200">
            해당 문의가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
