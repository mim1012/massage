import { notFound } from 'next/navigation';

// 임시 진단 라우트는 역할을 마쳤으므로 무력화한다(폴더는 이후 정리 예정).
export function GET() {
  notFound();
}
