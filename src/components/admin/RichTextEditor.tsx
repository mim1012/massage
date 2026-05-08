'use client';

import { AlignCenter, AlignLeft, AlignRight, ImagePlus, Palette, Type } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
};

const FONT_SIZES = [
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
  { label: '28px', value: '28px' },
];

const FONT_FAMILIES = [
  { label: '기본', value: 'inherit' },
  { label: 'Pretendard', value: 'Pretendard, sans-serif' },
  { label: 'Noto Sans KR', value: '"Noto Sans KR", sans-serif' },
  { label: '나눔고딕', value: '"Nanum Gothic", sans-serif' },
  { label: '고딕', value: 'Arial, sans-serif' },
  { label: '명조', value: '"Times New Roman", serif' },
];

function ensureEditorDocument() {
  if (typeof document === 'undefined') {
    return;
  }

  try {
    document.execCommand('styleWithCSS', false, 'true');
  } catch {
    // noop
  }
}

function clientNormalize(input: string) {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed);
  if (!looksLikeHtml) {
    return `<p>${trimmed.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br />')}</p>`;
  }
  return trimmed
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '<p><br /></p>')
    .replace(/<div>(?:\s|&nbsp;|<br\s*\/?>)*<\/div>/gi, '<div><br /></div>');
}

export default function RichTextEditor({ value, onChange, label, helperText }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const normalizedValue = useMemo(() => clientNormalize(value), [value]);

  const getEditorValue = (editor: HTMLDivElement) => {
    const html = editor.innerHTML.trim();
    if (!html || html === '<br>' || html === '<p><br></p>' || html === '<p><br /></p>') {
      return '';
    }
    return html;
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const currentNormalizedValue = clientNormalize(getEditorValue(editor));
    if (currentNormalizedValue !== normalizedValue) {
      editor.innerHTML = normalizedValue || '<p><br /></p>';
    }
  }, [normalizedValue]);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    onChange(clientNormalize(getEditorValue(editor)));
  };

  const focusEditor = () => {
    editorRef.current?.focus();
    ensureEditorDocument();
  };

  const applyExecCommand = (command: string, valueArg?: string) => {
    focusEditor();
    document.execCommand(command, false, valueArg);
    emitChange();
  };

  const applyFontSize = (fontSize: string) => {
    focusEditor();
    document.execCommand('fontSize', false, '7');

    const editor = editorRef.current;
    if (editor) {
      editor.querySelectorAll('font[size="7"]').forEach((node) => {
        const element = node as HTMLElement;
        element.removeAttribute('size');
        element.style.fontSize = fontSize;
      });
    }

    emitChange();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    focusEditor();

    for (const file of files) {
      const dataUrl = await readFileAsDataUrl(file);
      document.execCommand(
        'insertHTML',
        false,
        `<p><img src="${dataUrl}" alt="업소 상세 이미지" style="max-width: 100%; height: auto; border-radius: 12px;" /></p>`,
      );
    }

    emitChange();
    event.target.value = '';
  };

  return (
    <div className="space-y-2">
      {label ? <label className="mb-1 block text-xs font-bold text-gray-700">{label}</label> : null}
      <div className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-[var(--portal-brand-soft)]/60 px-3 py-3">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--portal-brand)]/15 bg-white px-2 py-1">
            <Palette className="h-4 w-4 text-[var(--portal-brand)]" />
            <input
              type="color"
              aria-label="글자 색상"
              className="h-8 w-10 cursor-pointer rounded border border-gray-200 bg-transparent"
              defaultValue="#1e40af"
              onChange={(event) => applyExecCommand('foreColor', event.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-[var(--portal-brand)]/15 bg-white px-2 py-1">
            <Type className="h-4 w-4 text-[var(--portal-brand)]" />
            <select className="rounded border border-gray-200 px-2 py-1 text-sm" defaultValue="16px" onChange={(event) => applyFontSize(event.target.value)}>
              {FONT_SIZES.map((size) => (
                <option key={size.value} value={size.value}>{size.label}</option>
              ))}
            </select>
            <select className="rounded border border-gray-200 px-2 py-1 text-sm" defaultValue="inherit" onChange={(event) => applyExecCommand('fontName', event.target.value)}>
              {FONT_FAMILIES.map((family) => (
                <option key={family.value} value={family.value}>{family.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-[var(--portal-brand)]/15 bg-white p-1">
            <button type="button" aria-label="왼쪽 정렬" onClick={() => applyExecCommand('justifyLeft')} className="rounded p-2 text-gray-600 hover:bg-[var(--portal-brand-soft)] hover:text-[var(--portal-brand)]">
              <AlignLeft className="h-4 w-4" />
            </button>
            <button type="button" aria-label="가운데 정렬" onClick={() => applyExecCommand('justifyCenter')} className="rounded p-2 text-gray-600 hover:bg-[var(--portal-brand-soft)] hover:text-[var(--portal-brand)]">
              <AlignCenter className="h-4 w-4" />
            </button>
            <button type="button" aria-label="오른쪽 정렬" onClick={() => applyExecCommand('justifyRight')} className="rounded p-2 text-gray-600 hover:bg-[var(--portal-brand-soft)] hover:text-[var(--portal-brand)]">
              <AlignRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--portal-brand)]/20 bg-white px-3 py-2 text-sm font-semibold text-[var(--portal-brand)] hover:bg-[var(--portal-brand-soft)]"
          >
            <ImagePlus className="h-4 w-4" /> 본문 이미지 추가
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={emitChange}
          className="min-h-[320px] w-full px-4 py-4 text-sm leading-7 text-gray-700 focus:outline-none"
          style={{ whiteSpace: 'pre-wrap' }}
          data-placeholder="업소 소개, 서비스 특징, 이용 안내, 주의사항 등을 자유롭게 작성하세요. 색상/글꼴/정렬/이미지도 적용됩니다."
        />
      </div>
      <style jsx>{`
        div[contenteditable='true']:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }
      `}</style>
      {helperText ? <p className="text-xs text-gray-500">{helperText}</p> : null}
    </div>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(String(event.target?.result ?? ''));
    reader.onerror = () => reject(new Error('이미지를 읽는 중 오류가 발생했습니다.'));
    reader.readAsDataURL(file);
  });
}
