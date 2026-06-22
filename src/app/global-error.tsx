'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDatabaseError = error.message === 'DATABASE_ERROR';

  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f8fafc', color: '#111827' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#dc2626' }}>페이지를 불러오지 못했습니다</p>
            <h1 style={{ margin: '12px 0 0', fontSize: '28px', fontWeight: 900 }}>
              {isDatabaseError ? '서버 통신이 잠시 불안정합니다.' : '일시적인 서버 오류가 발생했습니다.'}
            </h1>
            <p style={{ margin: '12px 0 0', fontSize: '14px', lineHeight: 1.7, color: '#6b7280' }}>
              {isDatabaseError
                ? '데이터베이스 연결이 잠깐 흔들렸습니다. 잠시 후 다시 시도하면 대부분 바로 복구됩니다.'
                : '예상치 못한 오류가 발생했습니다. 다시 시도해 주세요.'}
            </p>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => reset()}
                style={{
                  border: 0,
                  borderRadius: '10px',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  padding: '10px 16px',
                  cursor: 'pointer',
                }}
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
