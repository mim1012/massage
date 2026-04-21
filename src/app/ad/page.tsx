import type { Metadata } from 'next';
import PublicInfoPage from '@/components/PublicInfoPage';

export const metadata: Metadata = {
  title: '광고문의',
  description: '마사지찾기 광고 및 제휴 문의 안내',
};

const sections = [
  {
    title: '광고 문의 대상',
    paragraphs: [
      '마사지찾기는 업소 소개, 브랜드 홍보, 신규 오픈 안내, 이벤트 노출 등 서비스와 관련된 광고·제휴 문의를 받고 있습니다.',
      '문의 시에는 업체명, 담당자명, 연락 가능한 정보, 희망 상품 또는 예산, 노출을 원하는 지역과 기간을 함께 남겨 주시면 검토가 더 빠르게 진행됩니다.',
    ],
  },
  {
    title: '검토 기준',
    paragraphs: [
      '모든 광고 요청은 내부 운영 정책과 관련 법령 준수 여부를 기준으로 검토됩니다.',
    ],
    items: [
      '허위·과장 표현, 이용자를 오인시킬 수 있는 문구, 확인되지 않은 효능·후기형 광고는 제한될 수 있습니다.',
      '불법 서비스, 타인의 권리를 침해하는 소재, 공공질서 및 미풍양속에 반하는 내용은 접수되지 않습니다.',
      '광고 게재 이후에도 운영 정책 위반이 확인되면 수정 요청 또는 노출 중단이 이루어질 수 있습니다.',
    ],
  },
  {
    title: '진행 절차',
    paragraphs: [
      '문의 접수 후 내부 확인을 거쳐 가능 여부와 기본 조건을 안내드립니다.',
    ],
    items: [
      '1. 문의 접수',
      '2. 업종·소재 적합성 검토',
      '3. 상품, 기간, 단가 등 조건 협의',
      '4. 계약 또는 세부 일정 확정 후 집행',
    ],
  },
];

export default function AdPage() {
  return (
    <PublicInfoPage
      eyebrow="Advertising"
      title="광고문의"
      description="광고 및 제휴 문의는 운영 채널로 접수해 주세요. 서비스 성격에 맞는 제안만 검토하며, 이용자 보호와 법령 준수를 최우선으로 판단합니다."
      sections={sections}
      note="광고 집행 가능 여부와 노출 범위는 최종 심사 결과에 따라 달라질 수 있으며, 계약 체결 전까지 확정으로 간주되지 않습니다."
    />
  );
}
