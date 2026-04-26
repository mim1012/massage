'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Eye, EyeOff, X } from 'lucide-react';
import clsx from 'clsx';

type RegisterResult = {
  error?: string;
};

type AgreementType = 'terms' | 'privacy';

type ModalState = {
  open: boolean;
  title: string;
  content: string;
};

const CLOSED_MODAL: ModalState = {
  open: false,
  title: '',
  content: '',
};

export default function RegisterUserPage() {
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ nickname: '', id: '', password: '' });
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false,
  });
  const [modal, setModal] = useState<ModalState>(CLOSED_MODAL);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = (type: AgreementType) => {
    if (type === 'terms') {
      setModal({
        open: true,
        title: '이용약관',
        content:
          '[이용약관]\n\n제 1조 (목적)\n본 약관은 힐링찾기가 제공하는 관련 제반 서비스의 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.\n\n제 2조 (서비스의 제공 및 이용)\n1. 회사는 회원에게 테라피 업소 정보 제공, 예약 대행 등의 플랫폼 서비스를 제공합니다.\n2. 서비스 이용은 24시간 가동을 원칙으로 하되, 시스템 점검 등 경영상 이유로 중단될 수 있습니다.',
      });
      return;
    }

    setModal({
      open: true,
      title: '개인정보 수집 및 이용 동의',
      content:
        '[개인정보 수집 및 이용 동의]\n\n■ 수집항목: 닉네임, 아이디, 비밀번호\n■ 목적: 회원관리 및 서비스 제공\n■ 보관기간: 회원 탈퇴 시 즉시 파기',
    });
  };

  const closeModal = () => setModal(CLOSED_MODAL);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!agreements.terms || !agreements.privacy) {
      setError('필수 약관에 동의해 주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.nickname,
          email: form.id,
          password: form.password,
        }),
      });
      const result = (await response.json()) as RegisterResult;

      if (!response.ok) {
        setError(result.error ?? '회원가입에 실패했습니다.');
        return;
      }

      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle className="mx-auto mb-4 h-14 w-14 text-green-500" />
          <h1 className="mb-2 text-lg font-black text-gray-800">가입 완료!</h1>
          <p className="mb-6 text-sm text-gray-500">힐링찾기 일반 회원이 되신 것을 환영합니다.</p>
          <Link
            href="/auth/login"
            className="rounded bg-sky-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-sky-700"
          >
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  const isRequiredChecked = agreements.terms && agreements.privacy;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded bg-[#D4A373]">
              <span className="text-lg font-black text-white">힐</span>
            </div>
            <h1 className="mb-1 text-lg font-black text-gray-800">일반 고객 회원가입</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              required
              value={form.nickname}
              onChange={(event) => setForm((current) => ({ ...current, nickname: event.target.value }))}
              placeholder="닉네임"
              className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm focus:border-[#D4A373] focus:outline-none"
            />
            <input
              type="text"
              required
              value={form.id}
              onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))}
              placeholder="아이디"
              className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm focus:border-[#D4A373] focus:outline-none"
            />
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="비밀번호 (8자 이상)"
                className="w-full rounded border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-[#D4A373] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPw((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <label className="group flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={agreements.terms}
                    onChange={(event) => {
                      setAgreements((current) => ({ ...current, terms: event.target.checked }));
                      setError(null);
                    }}
                    className="accent-[#D4A373]"
                  />
                  <span className="text-xs text-gray-500 transition-colors group-hover:text-gray-700">
                    [필수] 이용약관 동의
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => openModal('terms')}
                  className="text-[11px] text-gray-400 underline hover:text-[#D4A373]"
                >
                  보기
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="group flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={agreements.privacy}
                    onChange={(event) => {
                      setAgreements((current) => ({ ...current, privacy: event.target.checked }));
                      setError(null);
                    }}
                    className="accent-[#D4A373]"
                  />
                  <span className="text-xs text-gray-500 transition-colors group-hover:text-gray-700">
                    [필수] 개인정보 수집 및 이용 동의
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => openModal('privacy')}
                  className="text-[11px] text-gray-400 underline hover:text-[#D4A373]"
                >
                  보기
                </button>
              </div>

              <div className="flex items-center">
                <label className="group flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={agreements.marketing}
                    onChange={(event) =>
                      setAgreements((current) => ({ ...current, marketing: event.target.checked }))
                    }
                    className="accent-[#D4A373]"
                  />
                  <span className="text-xs text-gray-500 transition-colors group-hover:text-gray-700">
                    [선택] 마케팅 정보 수신 동의
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isRequiredChecked}
              className={clsx(
                'w-full rounded py-2.5 text-sm font-bold shadow-sm transition-all active:scale-95',
                isRequiredChecked
                  ? 'bg-[#D4A373] text-white hover:bg-[#C29262]'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400',
              )}
            >
              {loading ? '가입 중...' : '가입하기'}
            </button>
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
          </form>

          <div className="mt-4 text-center text-xs">
            <span className="text-gray-400">이미 계정이 있으신가요? </span>
            <Link
              href="/auth/login"
              className="font-semibold text-[#D4A373] transition-colors hover:underline"
            >
              로그인
            </Link>
          </div>
        </div>
      </div>

      {modal.open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
              <h2 className="text-sm font-black text-gray-800">{modal.title}</h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-1 transition-colors hover:bg-gray-200"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-5">
              <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-gray-600">
                {modal.content}
              </div>
            </div>
            <div className="border-t border-gray-100 p-3 text-center">
              <button
                type="button"
                onClick={closeModal}
                className="w-full rounded-lg bg-gray-800 py-2 text-xs font-bold text-white transition-colors hover:bg-gray-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
