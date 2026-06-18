import { useRef } from 'react';

interface InputAreaProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onCancel: () => void;
  isStreaming: boolean;
  modelValue: string;
  onModelChange: (v: string) => void;
  onFileSelect: (files: FileList | null) => void;
  attachedFiles: File[];
  onRemoveFile: (idx: number) => void;
}

export default function InputArea({
  value,
  onChange,
  onSend,
  onCancel,
  isStreaming,
  onFileSelect,
  attachedFiles,
  onRemoveFile,
}: InputAreaProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 140) + 'px';
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming) onCancel();
      else onSend();
    }
  };

  return (
    <div className="input-area">
      {attachedFiles.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-2">
          {attachedFiles.map((f, i) => (
            <div className="file-chip" key={i}>
              {f.type.startsWith('image/') ? '🖼️' : '📄'} {f.name}
              <button onClick={() => onRemoveFile(i)} title="Hapus">
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="input-box">
        <textarea
          ref={textareaRef}
          className="msg-input"
          rows={1}
          placeholder="Tanya apa saja..."
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setTimeout(autoResize, 0);
          }}
          onKeyDown={handleKey}
        />
        <div className="input-toolbar">
          <button
            className="input-icon-btn"
            onClick={() => fileRef.current?.click()}
            title="Upload file/gambar"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 10l4-4 3 3 2-2 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf,.txt,.md,.json,.csv,.js,.py"
            multiple
            className="hidden"
            onChange={(e) => onFileSelect(e.target.files)}
          />

          <button
            className={`send-btn ${isStreaming ? 'cancel-mode' : ''}`}
            onClick={isStreaming ? onCancel : onSend}
            title={isStreaming ? 'Batal' : 'Kirim'}
          >
            {isStreaming ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                Batal
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1l6 6-6 6M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Kirim
              </>
            )}
          </button>
        </div>
      </div>
      <p className="text-[11px] text-[var(--text-dim)] text-center mt-1.5">
        NexusChat dapat membuat kesalahan. Verifikasi informasi penting.
      </p>
    </div>
  );
}
