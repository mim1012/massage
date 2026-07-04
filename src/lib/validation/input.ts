// 요청 본문은 신뢰할 수 없으므로 스토어에 닿기 전에 타입/길이를 검증한다.
// (JSON 타입 혼동으로 .trim()이 터져 500이 나는 것을 400으로 바꾸고, 대용량 텍스트 저장을 막는다.)

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isWithinLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength;
}

// 문자열이 아니거나 상한을 넘으면 null을 반환한다. 통과하면 trim된 값을 돌려준다.
export function normalizeBoundedString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) {
    return null;
  }
  return trimmed;
}

export const INPUT_LIMITS = {
  shortText: 120,
  phone: 40,
  name: 120,
  message: 2000,
  reviewContent: 2000,
  qnaQuestion: 2000,
  qnaAnswer: 4000,
  searchQuery: 100,
} as const;
