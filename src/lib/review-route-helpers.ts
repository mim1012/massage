export function normalizePublicReviewPatchInput(input: { rating?: number; content?: string }) {
  if (typeof input.rating !== 'number' || !Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error('평점은 1점부터 5점 사이여야 합니다.');
  }

  const normalizedContent = input.content?.trim();
  if (!normalizedContent) {
    throw new Error('리뷰 내용은 필수입니다.');
  }

  return {
    rating: input.rating,
    content: normalizedContent,
  };
}

export function createReviewDeleteResponse(success: boolean) {
  if (!success) {
    return Response.json({ error: '리뷰를 찾을 수 없습니다.' }, { status: 404 });
  }

  return Response.json({ success: true });
}
