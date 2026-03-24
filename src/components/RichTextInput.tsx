import React, { useRef, useEffect } from 'react';

interface RichTextInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  onFocus?: () => void;
  field: 'artista' | 'musica' | 'album' | 'direcao' | 'video_id';
}

const RichTextInput: React.FC<RichTextInputProps> = ({ value, onChange, label, placeholder, onFocus, field }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Synchronize internal state with external value ONLY if different
  // to avoid cursor jumping issues
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      let content = editorRef.current.innerHTML;
      
      // Auto-formatting logic:
      // We process the HTML to wrap specific patterns in <span style="font-weight: 400">
      let formatted = content;
      
      // 1. Wrap 「...」
      formatted = formatted.replace(/「(.*?)」/g, (match, p1) => {
        if (match.includes('font-weight: 400')) return match;
        return `<span style="font-weight: 400">「${p1}」</span>`;
      });
      
      // 2. Wrap ft., &, vs., , (for Artista/Direcao)
      if (field === 'artista' || field === 'direcao') {
        const patterns = ['ft.', '&amp;', 'vs.', ','];
        patterns.forEach(p => {
          const regex = new RegExp(`(?<!font-weight:\\s?400">)${p}`, 'g');
          formatted = formatted.replace(regex, `<span style="font-weight: 400">${p}</span>`);
        });
      }

      if (formatted !== content) {
        // Only update if changed to avoid cursor issues
        // Selection preservation is tricky, so we only do this on certain conditions 
        // or just accept that the user might see some jumps if they type exactly these characters.
      }
      
      onChange(formatted);
    }
  };

  const execCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    handleInput();
  };

  const insertVersionSymbols = () => {
    // Insert symbols 「 」 and place cursor inside
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
            onClick={() => execCommand('bold')}
            className="w-5 h-5 flex items-center justify-center text-[10px] font-bold hover:bg-amber-500 hover:text-black rounded transition-colors"
            title="Bold (Ctrl+B)"
          >B</button>
          <button 
            type="button" 
            onClick={() => execCommand('italic')}
            className="w-5 h-5 flex items-center justify-center text-[10px] italic hover:bg-amber-500 hover:text-black rounded transition-colors"
            title="Italic (Ctrl+I)"
          >I</button>
          <button 
            type="button" 
            onClick={insertVersionSymbols}
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
        
        /* Auto-formatting styles based on content */
        /* Note: Realistic auto-formatting usually requires complex observer-based DOM manipulation,
           but for these specific needs, we can handle it via the data storage/rendering layer or 
           CSS selectors if possible. Since we want specific parts of the text to be font-normal 
           even inside bold tags, we can use a small hack in the value provided to the component. */
      `}</style>
    </div>
  );
};

export default RichTextInput;
