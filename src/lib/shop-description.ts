import sanitizeHtml from 'sanitize-html';

const allowedTags = [
  'p',
  'div',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'span',
  'font',
  'img',
] as const;

const allowedAttributes: sanitizeHtml.IOptions['allowedAttributes'] = {
  '*': ['style'],
  img: ['src', 'alt', 'width', 'height'],
  font: ['color', 'face', 'size'],
};

const allowedStyles: sanitizeHtml.IOptions['allowedStyles'] = {
  '*': {
    color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb\((?:\s*\d+\s*,){2}\s*\d+\s*\)$/],
    'font-size': [/^\d+(?:px|rem|em|%)$/],
    'font-family': [/^[\w\s",'-]+$/],
    'text-align': [/^(left|center|right)$/],
  },
  img: {
    width: [/^\d+(?:px|%)$/],
    height: [/^\d+(?:px|%)$/],
  },
};

const baseSanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [...allowedTags],
  allowedAttributes,
  allowedStyles,
  allowedSchemes: ['http', 'https', 'data'],
  allowedSchemesAppliedToAttributes: ['src'],
  selfClosing: ['img', 'br'],
  enforceHtmlBoundary: true,
  parser: { lowerCaseTags: true },
};

function normalizeEmptyParagraphs(html: string) {
  return html
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '<p><br /></p>')
    .replace(/<div>(?:\s|&nbsp;|<br\s*\/?>)*<\/div>/gi, '<div><br /></div>');
}

export function sanitizeShopDescriptionHtml(input: string) {
  const sanitized = sanitizeHtml(input || '', baseSanitizeOptions)
    .replace(/\s+(?=<\/img>)/g, '')
    .trim();

  return normalizeEmptyParagraphs(sanitized);
}

export function normalizeShopDescription(input: string) {
  const trimmed = (input || '').trim();

  if (!trimmed) {
    return '';
  }

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed);
  if (!looksLikeHtml) {
    return sanitizeShopDescriptionHtml(`<p>${escapeHtml(trimmed).replace(/\n/g, '<br />')}</p>`);
  }

  return sanitizeShopDescriptionHtml(trimmed);
}

export function stripShopDescriptionToText(input: string) {
  return sanitizeHtml(input || '', {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
