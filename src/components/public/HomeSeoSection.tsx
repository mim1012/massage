import type { CSSProperties } from 'react';
import type { HomeSeoContent } from '@/lib/types';

const deferredSectionStyle: CSSProperties = {
  contentVisibility: 'auto',
  containIntrinsicSize: '720px',
};

export default function HomeSeoSection({ homeSeo }: { homeSeo: HomeSeoContent }) {
  return (
    <section
      aria-label="홈페이지 SEO 하단 안내"
      className="seo-content mt-6 rounded-lg border border-gray-200 bg-white p-5"
      style={deferredSectionStyle}
    >
      <h1 className="mb-3 text-xl font-bold text-slate-800">{homeSeo.section1Title}</h1>
      <p className="mb-6 text-sm leading-relaxed text-gray-600">{homeSeo.section1Content}</p>

      <h2 className="mb-2 text-lg font-bold text-slate-800">{homeSeo.section2Title}</h2>
      <p className="mb-6 text-sm leading-relaxed text-gray-600">{homeSeo.section2Content}</p>

      <h2 className="mb-2 text-lg font-bold text-slate-800">{homeSeo.section3Title}</h2>
      <p className="text-sm leading-relaxed text-gray-600">{homeSeo.section3Content}</p>
    </section>
  );
}
