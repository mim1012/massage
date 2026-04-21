import type { Metadata } from 'next';
import './globals.css';
import GlobalLayout from '@/components/GlobalLayout';

export const metadata: Metadata = {
  title: {
    default: '\ud790\ub9c1\ucc3e\uae30 - \uc804\uad6d \uc81c\ud734\uc5c5\uc18c \ub514\ub809\ud1a0\ub9ac',
    template: '%s | \ud790\ub9c1\ucc3e\uae30',
  },
  description:
    '\uc804\uad6d \ub9c8\uc0ac\uc9c0\u00b7\ud790\ub9c1 \uc5c5\uc18c\ub97c \uc9c0\uc5ed\ubcc4\u00b7\ud14c\ub9c8\ubcc4\ub85c \ud55c\ub208\uc5d0 \ucc3e\uc544\ubcf4\uc138\uc694. \uc2a4\uc6e8\ub514\uc2dc, \uc544\ub85c\ub9c8, \ud0c0\uc774, \uc2a4\ud3ec\uce20 \ub4f1 \ub2e4\uc591\ud55c \ud14c\ub9c8\uc758 \uac80\uc99d\ub41c \uc81c\ud734\uc5c5\uc18c\ub97c \uc18c\uac1c\ud569\ub2c8\ub2e4.',
  keywords: ['\ub9c8\uc0ac\uc9c0', '\ud790\ub9c1', '\uc2a4\uc6e8\ub514\uc2dc', '\uc544\ub85c\ub9c8', '\ud0c0\uc774\ub9c8\uc0ac\uc9c0'],
  robots: { index: true, follow: true },
  openGraph: { type: 'website', locale: 'ko_KR', siteName: '\ud790\ub9c1\ucc3e\uae30' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="bg-gray-100 text-gray-900 antialiased min-h-screen flex flex-col">
        <GlobalLayout>{children}</GlobalLayout>
      </body>
    </html>
  );
}
