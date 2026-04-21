import Link from 'next/link';

type InfoSection = {
  title: string;
  paragraphs: string[];
  items?: string[];
};

type PublicInfoPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: InfoSection[];
  note?: string;
};

export default function PublicInfoPage({
  eyebrow,
  title,
  description,
  sections,
  note,
}: PublicInfoPageProps) {
  return (
    <div className="mx-auto max-w-[960px] px-4 py-6 sm:py-8">
      <div className="rounded border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">{eyebrow}</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-[15px]">{description}</p>
      </div>

      <div className="mt-4 space-y-4">
        {sections.map((section) => (
          <section key={section.title} className="rounded border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
            <div className="mt-3 space-y-3 text-sm leading-7 text-gray-600 sm:text-[15px]">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            {section.items?.length ? (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-gray-600 sm:text-[15px]">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      {note ? (
        <div className="mt-4 rounded border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">
          {note}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-sm">
        <p>세부 운영 기준은 서비스 정책, 계약 조건, 관련 법령 변경에 따라 업데이트될 수 있습니다.</p>
        <Link href="/" className="font-bold text-red-600 hover:text-red-700">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
