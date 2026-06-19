'use client';

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ImagePlus,
  Indent,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Maximize,
  Minimize,
  Quote,
  Strikethrough,
  Underline as UnderlineIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
};

const FONT_SIZES = [
  { label: '11', value: '11px' },
  { label: '13', value: '13px' },
  { label: '15', value: '15px' },
  { label: '16', value: '16px' },
  { label: '19', value: '19px' },
  { label: '24', value: '24px' },
  { label: '28', value: '28px' },
  { label: '30', value: '30px' },
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
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentBgColor, setCurrentBgColor] = useState('#ffffff');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const getSelectedImage = () => {
    if (!selectedImageId) return null;
    return editorRef.current?.querySelector(`img[id="${selectedImageId}"]`) as HTMLImageElement | null;
  };

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

    const img = getSelectedImage();
    if (img && command.startsWith('justify')) {
      const align = command.replace('justify', '').toLowerCase();
      const textAlign = align === 'full' ? 'justify' : align;
      
      // Remove legacy centering styles from old images
      img.style.display = 'inline-block';
      img.style.margin = '';

      let parent = img.parentElement;
      while (parent && parent !== editorRef.current) {
        const display = window.getComputedStyle(parent).display;
        if (display === 'block' || parent.tagName === 'DIV' || parent.tagName === 'P') {
          parent.style.textAlign = textAlign;
          emitChange();
          return;
        }
        parent = parent.parentElement;
      }
    }

    document.execCommand(command, false, valueArg);
    emitChange();
  };

  const applyColor = (color: string) => {
    setCurrentColor(color);
    focusEditor();
    document.execCommand('foreColor', false, color);
    emitChange();
  };

  const applyBgColor = (color: string) => {
    setCurrentBgColor(color);
    focusEditor();
    document.execCommand('hiliteColor', false, color);
    emitChange();
  };

  const applyLink = () => {
    const url = prompt('링크 URL을 입력하세요:', 'https://');
    if (url) {
      applyExecCommand('createLink', url);
    }
  };

  const handleKeyDown = (_event: React.KeyboardEvent) => {
    if (currentColor !== '#000000') {
      ensureEditorDocument();
      document.execCommand('foreColor', false, currentColor);
    }
    const img = getSelectedImage();
    if (img && (_event.key === 'Backspace' || _event.key === 'Delete')) {
      img.remove();
      setSelectedImageId(null);
      emitChange();
    }
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      if (!target.id) {
        target.id = `img-${Date.now()}`;
      }
      setSelectedImageId(target.id);
    } else {
      setSelectedImageId(null);
    }
  };

  const resizeSelectedImage = (width: string) => {
    const img = getSelectedImage();
    if (img) {
      img.style.width = width;
      img.style.height = 'auto';
      emitChange();
    }
  };

  const applyFontSize = (fontSize: string) => {
    focusEditor();
    document.execCommand('fontSize', false, '7');

    const editor = editorRef.current;
    if (editor) {
      editor.querySelectorAll<HTMLElement>('font[size="7"], [style*="font-size"]').forEach((element) => {
        const currentStyle = element.getAttribute('style') || '';
        const nextStyle = /font-size\s*:/i.test(currentStyle)
          ? currentStyle.replace(/font-size\s*:\s*[^;]+/gi, `font-size: ${fontSize}`)
          : `${currentStyle.replace(/;?\s*$/, '')}${currentStyle.trim() ? '; ' : ''}font-size: ${fontSize}`;

        element.setAttribute('style', nextStyle.trim());
        if (element.tagName === 'FONT') {
          element.removeAttribute('size');
        }
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
        `<div style="text-align: center;"><img src="${dataUrl}" alt="업소 상세 이미지" draggable="true" style="max-width: 100%; height: auto; border-radius: 12px; display: inline-block; cursor: move;" /></div><p><br/></p>`,
      );
    }

    emitChange();
    event.target.value = '';
  };

  return (
    <div className="space-y-2">
      {label && !isFullscreen ? <label className="mb-1 block text-xs font-bold text-gray-700">{label}</label> : null}
      <div className={
        isFullscreen
          ? "fixed inset-0 z-[100] h-[100dvh] w-screen flex flex-col bg-white"
          : "overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm flex flex-col"
      }>
        <div 
          className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-gray-200 bg-[#f9f9f9] px-3 py-2 text-gray-600 shrink-0"
          onMouseDown={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName !== 'INPUT' && target.tagName !== 'SELECT') {
              e.preventDefault();
            }
          }}
        >
          <div className="flex items-center gap-1">
            <select className="h-8 cursor-pointer rounded border-none bg-transparent px-2 text-sm hover:bg-gray-200 focus:ring-0" defaultValue="P" onChange={(event) => applyExecCommand('formatBlock', event.target.value)}>
              <option value="P">본문</option>
              <option value="H1">제목 1</option>
              <option value="H2">제목 2</option>
              <option value="H3">제목 3</option>
            </select>
            <select className="h-8 cursor-pointer rounded border-none bg-transparent px-2 text-sm hover:bg-gray-200 focus:ring-0" defaultValue='"Nanum Gothic", sans-serif' onChange={(event) => applyExecCommand('fontName', event.target.value)}>
              {FONT_FAMILIES.map((family) => (
                <option key={family.value} value={family.value}>{family.label}</option>
              ))}
            </select>
            <select className="h-8 cursor-pointer rounded border-none bg-transparent px-2 text-sm hover:bg-gray-200 focus:ring-0" defaultValue="15px" onChange={(event) => applyFontSize(event.target.value)}>
              {FONT_SIZES.map((size) => (
                <option key={size.value} value={size.value}>{size.label}</option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-gray-300"></div>

          <div className="flex items-center gap-0.5">
            <button type="button" aria-label="굵게" onClick={() => applyExecCommand('bold')} className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200">
              <Bold className="h-4 w-4" />
            </button>
            <button type="button" aria-label="기울임" onClick={() => applyExecCommand('italic')} className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200">
              <Italic className="h-4 w-4" />
            </button>
            <button type="button" aria-label="밑줄" onClick={() => applyExecCommand('underline')} className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200">
              <UnderlineIcon className="h-4 w-4" />
            </button>
            <button type="button" aria-label="취소선" onClick={() => applyExecCommand('strikeThrough')} className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200">
              <Strikethrough className="h-4 w-4" />
            </button>
            <div className="relative flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200">
              <div className="flex flex-col items-center justify-center gap-[1px]">
                <span className="font-serif text-[13px] font-bold leading-none">A</span>
                <div className="h-[3px] w-3" style={{ backgroundColor: currentColor }}></div>
              </div>
              <input type="color" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" value={currentColor} onChange={(event) => applyColor(event.target.value)} />
            </div>
            <div className="relative flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200">
              <div className="flex flex-col items-center justify-center gap-[1px]">
                <span className="bg-gray-200 px-[2px] font-serif text-[13px] font-bold leading-none text-black">A</span>
                <div className="h-[3px] w-3" style={{ backgroundColor: currentBgColor }}></div>
              </div>
              <input type="color" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" value={currentBgColor} onChange={(event) => applyBgColor(event.target.value)} />
            </div>
          </div>

          <div className="h-4 w-px bg-gray-300"></div>

          <div className="flex items-center gap-0.5">
            <button type="button" aria-label="왼쪽 정렬" onClick={() => applyExecCommand('justifyLeft')} className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200">
              <AlignLeft className="h-4 w-4" />
            </button>
            <button type="button" aria-label="가운데 정렬" onClick={() => applyExecCommand('justifyCenter')} className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200">
              <AlignCenter className="h-4 w-4" />
            </button>
            <button type="button" aria-label="오른쪽 정렬" onClick={() => applyExecCommand('justifyRight')} className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200">
              <AlignRight className="h-4 w-4" />
            </button>
            <button type="button" aria-label="양쪽 정렬" onClick={() => applyExecCommand('justifyFull')} className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200">
              <AlignJustify className="h-4 w-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-gray-300"></div>

          <div className="flex items-center gap-0.5">
             <button type="button" aria-label="글머리 기호" onClick={() => applyExecCommand('insertUnorderedList')} className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200">
               <List className="h-4 w-4" />
             </button>
             <button type="button" aria-label="번호 매기기" onClick={() => applyExecCommand('insertOrderedList')} className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200">
               <ListOrdered className="h-4 w-4" />
             </button>
          </div>

          <div className="flex items-center gap-0.5">
             <button type="button" aria-label="인용구" onClick={() => applyExecCommand('formatBlock', 'BLOCKQUOTE')} className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200">
               <Quote className="h-4 w-4" />
             </button>
             <button type="button" aria-label="링크" onClick={applyLink} className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200">
               <LinkIcon className="h-4 w-4" />
             </button>
             <button type="button" aria-label="사진" onClick={() => fileInputRef.current?.click()} className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200">
               <ImagePlus className="h-4 w-4" />
             </button>
             <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
          </div>

          {selectedImageId && (
            <>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                <span className="text-[11px] text-blue-600 font-bold mx-1">사진 크기</span>
                <button type="button" onClick={() => resizeSelectedImage('100%')} className="text-[11px] px-1.5 py-1 hover:bg-blue-200 rounded font-bold text-gray-700">100%</button>
                <button type="button" onClick={() => resizeSelectedImage('75%')} className="text-[11px] px-1.5 py-1 hover:bg-blue-200 rounded font-bold text-gray-700">75%</button>
                <button type="button" onClick={() => resizeSelectedImage('50%')} className="text-[11px] px-1.5 py-1 hover:bg-blue-200 rounded font-bold text-gray-700">50%</button>
                <button type="button" onClick={() => resizeSelectedImage('25%')} className="text-[11px] px-1.5 py-1 hover:bg-blue-200 rounded font-bold text-gray-700">25%</button>
              </div>
            </>
          )}

          <div className="ml-auto flex items-center">
            <button type="button" aria-label="전체화면" onClick={() => setIsFullscreen(!isFullscreen)} className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200">
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onClick={handleEditorClick}
          onBlur={emitChange}
          onKeyDown={handleKeyDown}
          className={
            isFullscreen
              ? "flex-1 overflow-y-auto w-full max-w-[1000px] mx-auto px-6 pt-10 pb-32 text-base leading-8 text-gray-700 focus:outline-none"
              : "min-h-[800px] w-full px-4 py-4 text-sm leading-7 text-gray-700 focus:outline-none"
          }
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
