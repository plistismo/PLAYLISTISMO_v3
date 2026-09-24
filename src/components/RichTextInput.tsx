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

// Clean auto-formatting function to apply span styling without recursive nesting
const applyAutoFormatting = (html: string, field: string): string => {
  if (!html) return '';

  // 1. Strip existing formatting spans to prevent infinite nesting loops
  let cleaned = html;
  const spanRegex = /<span\s+style="font-weight:\s*400;?"[^>]*>(.*?)<\/span>/gi;
  let prevCleaned = '';
  while (cleaned !== prevCleaned) {
    prevCleaned = cleaned;
    cleaned = cleaned.replace(spanRegex, '$1');
  }

  let formatted = cleaned;

  // 2. Wrap brackets 「...」
  formatted = formatted.replace(/「(.*?)」/g, '<span style="font-weight: 400">「$1」</span>');

  // 3. Wrap ft., &, vs., , (for Artista/Direcao)
  if (field === 'artista' || field === 'direcao') {
    // Match "ft." as a standalone word (case-insensitive, requiring literal dot)
    formatted = formatted.replace(/(?<![a-zA-Z0-9])ft\.(?![a-zA-Z0-9])/gi, (match) => {
      return `<span style="font-weight: 400">${match}</span>`;
    });

    // Match "vs." as a standalone word (case-insensitive, requiring literal dot)
    formatted = formatted.replace(/(?<![a-zA-Z0-9])vs\.(?![a-zA-Z0-9])/gi, (match) => {
      return `<span style="font-weight: 400">${match}</span>`;
    });

    // Match "&amp;" (html entity for &)
    formatted = formatted.replace(/&amp;/g, '<span style="font-weight: 400">&amp;</span>');

    // Match "," (comma)
    formatted = formatted.replace(/,/g, '<span style="font-weight: 400">,</span>');
  }

  return formatted;
};

const RichTextInput: React.FC<RichTextInputProps> = ({ value, onChange, label, placeholder, onFocus, field }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Synchronize internal state with external value ONLY if different
  // uses saveSelection/restoreSelection to prevent cursor jumping
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      const isFocused = document.activeElement === editorRef.current;
      const saved = isFocused ? saveSelection(editorRef.current) : null;
      editorRef.current.innerHTML = value || '';
      if (isFocused && saved) {
        restoreSelection(editorRef.current, saved);
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const content = sanitizeHTML(editorRef.current.innerHTML);
      const formatted = applyAutoFormatting(content, field);
      onChange(formatted);
    }
  };

  const execCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    handleInput();
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
        <label className="text-xs text-amber-700 uppercase font-bold group-focus-within:text-amber-500 transition-colors">
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
        onFocus={onFocus}
        className="w-full p-2 bg-black border border-amber-900/50 outline-none focus:border-amber-500 text-lg min-h-[44px] break-words rich-text-input"
        data-placeholder={placeholder}
      />
      
      <style>{`
        .rich-text-input:empty:before {
          content: attr(data-placeholder);
          color: rgba(217, 119, 6, 0.3);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default RichTextInput;
