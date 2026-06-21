export const HOME_SEO_TITLE_MAX_LENGTH = 120;
export const HOME_SEO_CONTENT_MAX_LENGTH = 4000;

export function sanitizeBoundedText(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}
