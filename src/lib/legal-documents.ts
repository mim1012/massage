export type LegalDocumentSlug = 'privacy' | 'terms' | 'youth' | 'ad' | 'mobile';

export type LegalSection = {
  title: string;
  paragraphs: string[];
  items?: string[];
};

export type EditableLegalDocument = {
  eyebrow: string;
  title: string;
  description: string;
  note: string;
  body: string;
};

export type ResolvedLegalDocument = EditableLegalDocument & {
  slug: LegalDocumentSlug;
  sections: LegalSection[];
};

export function parseLegalDocumentBody(body: string): LegalSection[] {
  const normalized = body
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();

  if (!normalized) {
    return [];
  }

  const sections: LegalSection[] = [];
  let current: LegalSection | null = null;
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (!current || paragraphBuffer.length === 0) {
      return;
    }

    current.paragraphs.push(paragraphBuffer.join(' ').trim());
    paragraphBuffer = [];
  };

  const flushSection = () => {
    flushParagraph();
    if (!current) {
      return;
    }

    const section: LegalSection = {
      title: current.title,
      paragraphs: current.paragraphs,
    };

    if (current.items?.length) {
      section.items = current.items;
    }

    sections.push(section);
  };

  for (const line of normalized.split('\n')) {
    if (!line) {
      flushParagraph();
      continue;
    }

    if (line.startsWith('## ')) {
      flushSection();
      current = {
        title: line.slice(3).trim(),
        paragraphs: [],
        items: [],
      };
      paragraphBuffer = [];
      continue;
    }

    if (!current) {
      current = {
        title: '기본 안내',
        paragraphs: [],
        items: [],
      };
    }

    if (line.startsWith('- ')) {
      flushParagraph();
      current.items ??= [];
      current.items.push(line.slice(2).trim());
      continue;
    }

    paragraphBuffer.push(line);
  }

  flushSection();
  return sections;
}

export function buildLegalDocumentBody(sections: LegalSection[]) {
  return sections
    .map((section) => {
      const lines = [`## ${section.title}`];

      section.paragraphs.forEach((paragraph, index) => {
        if (index > 0) {
          lines.push('');
        }
        lines.push(paragraph.trim());
      });

      if (section.items?.length) {
        if (section.paragraphs.length > 0) {
          lines.push('');
        }
        section.items.forEach((item) => {
          lines.push(`- ${item.trim()}`);
        });
      }

      return lines.join('\n');
    })
    .join('\n\n');
}

const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: '수집하는 정보',
    paragraphs: [
      '회사는 회원가입, 문의 접수, 서비스 이용 과정에서 이름 또는 닉네임, 연락처, 로그인 정보, 접속 기록, 기기 및 브라우저 정보 등 필요한 범위의 개인정보를 처리할 수 있습니다.',
      '민감정보는 법령상 허용되거나 별도 동의를 받은 경우에 한하여 최소 범위로 처리합니다.',
    ],
  },
  {
    title: '이용 목적',
    paragraphs: ['수집한 정보는 회원 식별, 서비스 제공, 문의 응대, 부정 이용 방지, 통계 분석, 공지 전달, 법령상 의무 이행을 위해 사용됩니다.'],
  },
  {
    title: '보관 및 파기',
    paragraphs: [
      '개인정보는 수집·이용 목적이 달성되면 지체 없이 파기하는 것을 원칙으로 합니다.',
      '다만 전자상거래, 소비자보호, 통신비밀보호 등 관련 법령에서 일정 기간 보관을 요구하는 경우에는 해당 기간 동안 안전하게 보관한 뒤 파기합니다.',
    ],
  },
  {
    title: '제3자 제공 및 보호',
    paragraphs: ['회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않으며, 법령상 근거가 있거나 서비스 제공에 꼭 필요한 경우에만 제한적으로 처리합니다.'],
    items: [
      '접근 권한 최소화, 비밀번호 보호, 접속 기록 관리 등 기본적인 보안 조치를 유지합니다.',
      '이용자는 자신의 개인정보 열람, 정정, 삭제, 처리정지 요청을 관련 법령 범위 내에서 할 수 있습니다.',
      '권리 행사 또는 개인정보 관련 문의는 서비스 하단에 안내된 운영 채널을 통해 접수할 수 있습니다.',
    ],
  },
];

const TERMS_SECTIONS: LegalSection[] = [
  {
    title: '서비스 이용',
    paragraphs: [
      '마사지찾기는 업소 정보, 커뮤니티 게시판, 회원 기능 등 온라인 정보 서비스를 제공합니다.',
      '회사는 서비스의 안정적 운영을 위해 필요한 경우 일부 기능의 제공 범위, 운영 시간, 노출 기준을 조정할 수 있습니다.',
    ],
  },
  {
    title: '회원의 책임',
    paragraphs: ['회원은 관계 법령, 본 약관, 서비스 내 안내사항을 준수해야 하며 타인의 권리를 침해하거나 서비스 운영을 방해해서는 안 됩니다.'],
    items: [
      '타인의 계정 도용, 허위 정보 등록, 자동화된 비정상 접근은 금지됩니다.',
      '게시글, 후기, 문의 내용에 대한 책임은 작성자에게 있으며 사실과 다른 내용으로 분쟁이 발생하지 않도록 주의해야 합니다.',
      '운영자는 정책 위반이 확인된 계정 또는 게시물에 대해 사전 통지 없이 제한, 숨김, 삭제 조치를 할 수 있습니다.',
    ],
  },
  {
    title: '면책 및 제한',
    paragraphs: [
      '서비스에 게시된 업소 정보나 이용 후기 등은 작성 주체 또는 제휴사에 의해 제공될 수 있으며, 회사는 표시 내용의 정확성·적법성을 보증하지 않습니다.',
      '회사는 천재지변, 통신 장애, 외부 시스템 장애, 이용자 귀책 사유로 인한 손해에 대해 관련 법령이 허용하는 범위 내에서 책임이 제한될 수 있습니다.',
    ],
  },
  {
    title: '약관 변경',
    paragraphs: [
      '관련 법령 또는 서비스 정책 변경이 있는 경우 약관은 수정될 수 있으며, 중요한 변경은 서비스 화면 또는 공지사항을 통해 안내합니다.',
      '변경된 약관 시행 후에도 서비스를 계속 이용하는 경우 개정 내용에 동의한 것으로 볼 수 있습니다.',
    ],
  },
];

const YOUTH_SECTIONS: LegalSection[] = [
  {
    title: '청소년 보호 원칙',
    paragraphs: [
      '회사는 청소년이 유해한 정보에 노출되지 않도록 관련 법령과 내부 기준에 따라 서비스 운영 정책을 수립하고 적용합니다.',
      '청소년 보호 책임자 지정, 신고 접수, 유해 정보 차단 및 사후 조치 절차를 통해 건전한 온라인 이용 환경을 유지하기 위해 노력합니다.',
    ],
  },
  {
    title: '유해 정보 관리',
    paragraphs: [
      '법령 또는 운영정책에 위반되는 게시물, 후기, 문의, 광고성 콘텐츠는 모니터링 또는 신고 접수를 통해 확인 후 제한·삭제될 수 있습니다.',
    ],
    items: [
      '청소년에게 부적절한 표현, 선정적 내용, 불법 서비스 유도 문구는 노출 제한 대상입니다.',
      '운영자는 반복 위반 계정이나 게시물에 대해 사전 통지 없이 숨김, 삭제, 이용 제한 조치를 할 수 있습니다.',
    ],
  },
  {
    title: '신고 및 문의',
    paragraphs: [
      '청소년 보호 관련 문의나 신고는 서비스 하단의 고객센터 또는 운영 채널을 통해 접수할 수 있으며, 확인 후 필요한 조치를 안내합니다.',
    ],
  },
];

const AD_SECTIONS: LegalSection[] = [
  {
    title: '광고 상품 안내',
    paragraphs: [
      '힐링찾기는 메인 노출, 프리미엄 배너, 제휴 업소 소개 등 다양한 형태의 광고 상품을 운영할 수 있습니다.',
      '광고 상품 구성과 노출 위치는 서비스 운영 정책과 화면 개편에 따라 조정될 수 있습니다.',
    ],
  },
  {
    title: '진행 절차',
    paragraphs: ['광고 문의 접수 후 담당자가 상품 구성, 일정, 비용, 노출 조건을 안내하며 협의 완료 후 진행됩니다.'],
    items: [
      '광고 집행 전 업소 정보와 소재 검수가 진행될 수 있습니다.',
      '허위, 과장, 법령 위반 소지가 있는 광고 문구는 제한될 수 있습니다.',
    ],
  },
  {
    title: '문의 방법',
    paragraphs: ['광고 관련 상담은 푸터 연락처 또는 제휴/입점 문의 채널을 통해 접수할 수 있습니다.'],
  },
];

const MOBILE_SECTIONS: LegalSection[] = [
  {
    title: '모바일웹 이용 안내',
    paragraphs: [
      '힐링찾기 모바일웹은 스마트폰과 태블릿 환경에서 업소 검색, 상세 조회, 커뮤니티 이용이 가능하도록 최적화되어 있습니다.',
      '일부 기능은 브라우저 종류, 기기 성능, 로그인 상태에 따라 동작 방식이 달라질 수 있습니다.',
    ],
  },
  {
    title: '권장 환경',
    paragraphs: ['최신 버전의 iOS Safari, Android Chrome 등 표준 브라우저 환경에서 이용하는 것을 권장합니다.'],
    items: [
      '모바일웹 이용 시 데이터 환경과 네트워크 상태에 따라 로딩 속도가 달라질 수 있습니다.',
      '앱 설치 없이 브라우저만으로 주요 기능을 사용할 수 있습니다.',
    ],
  },
  {
    title: '문의 및 지원',
    paragraphs: ['모바일 환경에서 접속 또는 표시 문제가 발생하는 경우 고객센터를 통해 문의해 주세요.'],
  },
];

export const DEFAULT_LEGAL_DOCUMENTS: Record<LegalDocumentSlug, EditableLegalDocument> = {
  privacy: {
    eyebrow: 'Privacy',
    title: '개인정보처리방침',
    description:
      '마사지찾기는 이용자의 개인정보를 최소한으로 처리하고, 관련 법령과 합리적인 보안 기준에 따라 안전하게 관리하기 위해 노력합니다. 아래 내용은 서비스 운영에 적용되는 기본 처리 원칙을 설명합니다.',
    note: '실제 수집 항목과 보관 기간은 회원가입, 문의, 이벤트 참여 등 개별 화면에서 추가로 고지될 수 있습니다.',
    body: buildLegalDocumentBody(PRIVACY_SECTIONS),
  },
  terms: {
    eyebrow: 'Terms',
    title: '이용약관',
    description:
      '본 약관은 마사지찾기 서비스 이용과 관련한 기본 원칙을 안내하기 위한 요약 안내문입니다. 실제 운영 과정에서는 개별 서비스 화면의 고지, 관련 법령, 운영정책이 함께 적용될 수 있습니다.',
    note: '법령상 필수 고지 또는 운영정책 개정이 있는 경우 별도 공지 후 약관 내용이 보완될 수 있습니다.',
    body: buildLegalDocumentBody(TERMS_SECTIONS),
  },
  youth: {
    eyebrow: 'Youth Policy',
    title: '청소년보호정책',
    description:
      '마사지찾기는 청소년 보호를 위해 유해 정보 노출을 최소화하고, 신고 및 모니터링 절차를 통해 안전한 서비스 환경을 유지하기 위해 노력합니다.',
    note: '청소년 보호 관련 신고는 운영 채널을 통해 접수할 수 있으며, 접수된 내용은 내부 정책에 따라 신속히 검토됩니다.',
    body: buildLegalDocumentBody(YOUTH_SECTIONS),
  },
  ad: {
    eyebrow: 'Advertising',
    title: '광고안내',
    description:
      '힐링찾기 광고 상품과 진행 절차에 대한 기본 안내입니다. 실제 비용과 노출 조건은 담당자 안내 및 협의 결과에 따라 확정됩니다.',
    note: '광고 진행 가능 여부와 노출 일정은 내부 검수 및 운영 정책에 따라 조정될 수 있습니다.',
    body: buildLegalDocumentBody(AD_SECTIONS),
  },
  mobile: {
    eyebrow: 'Mobile Web',
    title: '모바일웹 안내',
    description:
      '힐링찾기 모바일웹은 별도 앱 설치 없이 스마트폰 브라우저에서 주요 기능을 이용할 수 있도록 제공됩니다.',
    note: '기기별 표시 차이나 접속 이슈는 고객센터로 문의해 주시면 확인 후 안내드립니다.',
    body: buildLegalDocumentBody(MOBILE_SECTIONS),
  },
};

export function resolveLegalDocument(slug: LegalDocumentSlug, stored?: Partial<EditableLegalDocument> | null): ResolvedLegalDocument {
  const fallback = DEFAULT_LEGAL_DOCUMENTS[slug];
  const eyebrow = stored?.eyebrow?.trim() || fallback.eyebrow;
  const title = stored?.title?.trim() || fallback.title;
  const description = stored?.description?.trim() || fallback.description;
  const note = stored?.note?.trim() || fallback.note;
  const body = stored?.body?.trim() || fallback.body;

  return {
    slug,
    eyebrow,
    title,
    description,
    note,
    body,
    sections: parseLegalDocumentBody(body),
  };
}
