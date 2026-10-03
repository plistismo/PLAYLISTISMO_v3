import React, { useRef, useEffect } from 'react';
import { sanitizeHTML } from '../lib/sanitize.ts';

interface RichTextInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  onFocus?: () => void;
  field: 'artista' | 'musica' | 'album' | 'direcao' | 'video_id';
}

// Helper to save current cursor selection in contentEditable
const saveSelection = (containerEl: HTMLElement) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);

  if (!containerEl.contains(range.startContainer)) return null;

  const preSelectionRange = range.cloneRange();
  preSelectionRange.selectNodeContents(containerEl);
  preSelectionRange.setEnd(range.startContainer, range.startOffset);
  const start = preSelectionRange.toString().length;

  return {
    start: start,
    end: start + range.toString().length
  };
};

// Helper to restore cursor selection in contentEditable
const restoreSelection = (containerEl: HTMLElement, savedSel: { start: number; end: number } | null) => {
  if (!savedSel) return;
  const selection = window.getSelection();
  if (!selection) return;

  let charIndex = 0;
  const range = document.createRange();
  range.setStart(containerEl, 0);
  range.collapse(true);

  const nodeQueue: Node[] = [containerEl];
  let node;
  let foundStart = false;
  let foundEnd = false;

  while ((node = nodeQueue.shift())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const nextCharIndex = charIndex + (node.textContent?.length || 0);
      if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
        range.setStart(node, savedSel.start - charIndex);
        foundStart = true;
      }
      if (!foundEnd && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
        range.setEnd(node, savedSel.end - charIndex);
        foundEnd = true;
      }
      charIndex = nextCharIndex;
    } else {
      let i = node.childNodes.length;
      while (i--) {
        nodeQueue.unshift(node.childNodes[i]);
      }
    }
  }

  if (!foundStart) {
    range.setStart(containerEl, containerEl.childNodes.length);
  }
  if (!foundEnd) {
    range.setEnd(containerEl, containerEl.childNodes.length);
  }

  selection.removeAllRanges();
  selection.addRange(range);
};

/**
 * Unwraps previous connector spans so we don't nest spans or corrupt HTML on re-runs.
 */
export const unwrapConnectorSpans = (html: string): string => {
  if (!html) return '';
  let prev = '';
  let curr = html;
  const spanPattern = /<span\b([^>]*)>(.*?)<\/span>/gi;
  let iterations = 0;
  while (curr !== prev && iterations < 10) {
    prev = curr;
    curr = curr.replace(spanPattern, (fullMatch, attrs, inner) => {
      const isConnector =
        /opacity:\s*0?\.8/i.test(attrs) ||
        /opacity-80/i.test(attrs) ||
        /^(?:\s*(?:ft\.|feat\.|feat|ft|vs\.|vs|&|&amp;|,)\s*|「.*?」)$/i.test(inner.trim());
      return isConnector ? inner : fullMatch;
    });
    iterations++;
  }
  return curr;
};

/**
 * Applies live relational connector formatting:
 * Tokens: case-insensitive ft., feat., feat, ft, vs., vs, &, &amp;, comma, and brackets 「...」
 * Wrapped in lighter font weight (font-normal / font-weight: 400) with opacity-80.
 */
export const formatCreditsConnectors = (html: string, field?: string): string => {
  if (!html) return '';

  const htmlCleaned = html.replace(/&nbsp;/gi, ' ');
  const cleaned = unwrapConnectorSpans(htmlCleaned);
  const parts = cleaned.split(/(<[^>]+>)/g);

  // Relational connectors apply to Artista, Musica (Track), and Direcao
  const isRelationalField = !field || field === 'artista' || field === 'musica' || field === 'direcao';

  const connectorRegex = isRelationalField
    ? /(「[^」]+」|(?<![a-zA-Z0-9À-ÿ])(?:feat\.|feat\b|ft\.|ft\b|vs\.|vs\b)(?![a-zA-Z0-9À-ÿ])|&amp;|&(?!(?:amp|lt|gt|quot|apos|nbsp|#\d+|#x[0-9a-fA-F]+);)|(?<!\d),(?!\d))/gi
    : /(「[^」]+」)/gi;

  for (let i = 0; i < parts.length; i += 2) {
    if (!parts[i]) continue;
    parts[i] = parts[i].replace(connectorRegex, (match) => {
      return `<span class="font-normal opacity-80" style="font-weight: 400; opacity: 0.8;">${match}</span>`;
    });
  }

  return parts.join('');
};

const RichTextInput: React.FC<RichTextInputProps> = ({ value, onChange, label, placeholder, onFocus, field }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isBoldField = field === 'artista' || field === 'musica';

  // Synchronize internal state with external value ONLY if different
  // uses saveSelection/restoreSelection to prevent cursor jumping
  useEffect(() => {
    if (editorRef.current) {
      const formattedValue = formatCreditsConnectors(value || '', field);
      if (editorRef.current.innerHTML !== formattedValue) {
        const isFocused = document.activeElement === editorRef.current;
        const saved = isFocused ? saveSelection(editorRef.current) : null;
        editorRef.current.innerHTML = formattedValue;
        if (isFocused && saved) {
          restoreSelection(editorRef.current, saved);
        }
      }
    }
  }, [value, field]);

  const handleInput = () => {
    if (editorRef.current) {
      const saved = saveSelection(editorRef.current);
      const content = sanitizeHTML(editorRef.current.innerHTML);
      const formatted = formatCreditsConnectors(content, field);
      if (editorRef.current.innerHTML !== formatted) {
        editorRef.current.innerHTML = formatted;
        if (saved) {
          restoreSelection(editorRef.current, saved);
        }
      }
      onChange(formatted);
    }
  };

  const execCommand = (command: string, arg?: string) => {
    try {
      document.execCommand('styleWithCSS', false, 'false');
    } catch { }
    document.execCommand(command, false, arg);
    handleInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      execCommand('bold');
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      execCommand('italic');
    }
  };

  const insertVersionSymbols = () => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const symbols = document.createTextNode('「」');
    range.deleteContents();
    range.insertNode(symbols);

    // Move cursor between the brackets
    range.setStart(symbols, 1);
    range.setEnd(symbols, 1);
    selection.removeAllRanges();
    selection.addRange(range);

    handleInput();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleInput();
  };

  return (
    <div className="group relative">
      <div className="flex justify-between items-end mb-1">
        <label className="text-xs text-amber-500/80 uppercase font-bold tracking-wider font-['Jost',sans-serif] group-focus-within:text-amber-400 transition-colors">
          {label}
        </label>
        <div className="flex gap-1 bg-black border border-amber-900/30 rounded-t px-1 py-0.5 opacity-40 group-focus-within:opacity-100 transition-opacity">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand('bold');
            }}
            className="w-5 h-5 flex items-center justify-center text-[10px] font-bold hover:bg-amber-500 hover:text-black rounded transition-colors"
            title="Bold (Ctrl+B)"
          >B</button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand('italic');
            }}
            className="w-5 h-5 flex items-center justify-center text-[10px] italic hover:bg-amber-500 hover:text-black rounded transition-colors"
            title="Italic (Ctrl+I)"
          >I</button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              insertVersionSymbols();
            }}
            className="px-1 h-5 flex items-center justify-center text-[10px] hover:bg-amber-500 hover:text-black rounded transition-colors"
            title="Insert Version Brackets"
          >「」</button>
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        className={`w-full p-2 bg-black border border-amber-900/50 outline-none focus:border-amber-400 text-lg min-h-[44px] break-words rich-text-input font-['Jost',sans-serif] ${
          isBoldField
            ? 'font-bold text-[#f8f8f8] tracking-[0.03em] field-bold'
            : 'font-semibold text-white/90 tracking-[0.02em] field-semibold'
        }`}
        style={{ fontWeight: isBoldField ? 700 : 600 }}
        data-placeholder={placeholder}
      />

      <style>{`
        .rich-text-input {
          font-family: 'Jost', sans-serif !important;
        }
        .rich-text-input.field-bold {
          font-weight: 700 !important;
          color: #f8f8f8 !important;
        }
        .rich-text-input.field-semibold {
          font-weight: 600 !important;
          color: rgba(255, 255, 255, 0.92) !important;
        }
        .rich-text-input:empty:before {
          content: attr(data-placeholder);
          color: rgba(217, 119, 6, 0.3);
          pointer-events: none;
          font-weight: 400 !important;
        }
        .rich-text-input span[style*="font-weight: 400"],
        .rich-text-input span[style*="font-weight:400"],
        .rich-text-input span[style*="400"],
        .rich-text-input span[style*="font-weight: normal"],
        .rich-text-input .font-normal {
          font-weight: 400 !important;
        }
        .rich-text-input span[style*="opacity: 0.8"],
        .rich-text-input span[style*="opacity:0.8"],
        .rich-text-input .opacity-80 {
          opacity: 0.8 !important;
        }
        .rich-text-input b, .rich-text-input strong {
          font-weight: 700 !important;
        }
        .rich-text-input i, .rich-text-input em {
          font-style: italic !important;
        }
      `}</style>
    </div>
  );
};

export default RichTextInput;
