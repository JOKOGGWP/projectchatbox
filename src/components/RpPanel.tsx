import { useState, useRef } from 'react';
import type { RpCharacter } from '../types';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

const PRESETS: Omit<RpCharacter, 'id'>[] = [
  { name: 'Anime Waifu', emoji: '🌸', prompt: 'Kamu adalah seorang anime waifu yang manis, perhatian, dan penyayang. Kamu sering menggunakan emoji dan bahasa yang lembut.' },
  { name: 'Sensei Bijak', emoji: '🧙', prompt: 'Kamu adalah seorang guru bijak dan berpengalaman. Kamu menjelaskan konsep dengan sabar dan selalu memberikan analogi yang mudah dipahami.' },
  { name: 'Elite Hacker', emoji: '👾', prompt: 'Kamu adalah seorang hacker elite dengan pengetahuan teknis yang sangat dalam. Kamu berbicara dengan percaya diri dan menggunakan jargon teknis.' },
  { name: 'Best Friend', emoji: '🤝', prompt: 'Kamu adalah sahabat terbaik pengguna. Santai, humoris, dan selalu ada untuk mendengarkan. Gunakan bahasa sehari-hari yang casual.' },
  { name: 'Poet Romantis', emoji: '📜', prompt: 'Kamu adalah seorang penyair romantis dari era Victoria yang terjebak di dunia modern. Bahasamu puitis dan penuh perasaan.' },
];

interface RpPanelProps {
  characters: RpCharacter[];
  onAddChar: (c: Omit<RpCharacter, 'id'>) => void;
  onRemoveChar: (id: string) => void;
  onCallAi: (messages: Array<{ role: string; content: string }>) => Promise<string>;
  modelOptions: { value: string; label: string }[];
  isStreaming: boolean;
}

export default function RpPanel({ characters, onAddChar, onRemoveChar, onCallAi, isStreaming }: RpPanelProps) {
  const [activeChar, setActiveChar] = useState<RpCharacter | null>(null);
  const [history, setHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const allChars = [...PRESETS.map((p, i) => ({ ...p, id: `preset_${i}` })), ...characters];

  const handleSend = async () => {
    if (!input.trim() || !activeChar || isReplying || isStreaming) return;
    const userMsg = input.trim();
    setInput('');
    const newHistory = [...history, { role: 'user', content: userMsg }];
    setHistory(newHistory);
    setIsReplying(true);

    try {
      const msgs = [
        { role: 'system', content: activeChar.prompt + '\n\nKamu sedang roleplay sebagai karakter ini. Jangan keluar dari karakter.' },
        ...newHistory,
      ];
      const resp = await onCallAi(msgs);
      setHistory([...newHistory, { role: 'assistant', content: resp }]);
    } catch {
      // handled
    } finally {
      setIsReplying(false);
    }
  };

  const handleSelectChar = (char: RpCharacter) => {
    setActiveChar(char);
    setHistory([]);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="scroll-panel" ref={scrollRef}>
        <div className="panel-info">
          <h3 style={{ color: 'var(--rp)' }}>🎭 RP Mode (Role Play)</h3>
          <p>Main peran dengan karakter AI. Pilih preset atau buat karakter custom Anda sendiri.</p>
        </div>

        <div className="rp-config">
          <div>
            <label className="form-label mb-1.5 block">Pilih Karakter:</label>
            <div className="flex flex-wrap gap-2">
              {allChars.map((c) => (
                <button
                  key={c.id}
                  className={`rp-preset-btn ${activeChar?.id === c.id ? 'active' : ''}`}
                  onClick={() => handleSelectChar(c)}
                >
                  {c.emoji} {c.name}
                  {c.id.startsWith('custom_') && (
                    <span className="ml-1 text-[var(--text-dim)] hover:text-[var(--error)]" onClick={(e) => { e.stopPropagation(); onRemoveChar(c.id); if (activeChar?.id === c.id) setActiveChar(null); }}>×</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="form-label mb-1 block">Atau buat custom:</label>
            <input className="form-input mb-1.5" placeholder="Nama karakter..." value={customName} onChange={(e) => setCustomName(e.target.value)} />
            <textarea className="form-input min-h-[80px] resize-y font-inherit leading-relaxed" placeholder="Deskripsi karakter, personality, gaya bicara..." value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} />
            <button className="btn btn-sm btn-success mt-1.5" onClick={() => {
              if (customName && customPrompt) {
                onAddChar({ name: customName, emoji: '🎭', prompt: customPrompt });
                setCustomName('');
                setCustomPrompt('');
              }
            }}>
              Simpan Karakter
            </button>
          </div>
        </div>

        {activeChar && (
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="text-lg">{activeChar.emoji}</span>
              <span className="text-sm font-medium text-[var(--rp)]">{activeChar.name}</span>
            </div>
            {history.map((msg, i) => (
              <div key={i} className={`msg-row ${msg.role === 'user' ? 'user' : ''}`}>
                <div className={`msg-avatar ${msg.role === 'user' ? 'user' : 'ai-alt3'}`}>
                  {msg.role === 'user' ? 'U' : activeChar.emoji}
                </div>
                <div className="msg-content">
                  <div className={`msg-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
                    {msg.role === 'user' ? (
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked(msg.content, { async: false }) as string, { ADD_ATTR: ['class'] }) }} />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isReplying && (
              <div className="msg-row">
                <div className="msg-avatar ai-alt3">{activeChar.emoji}</div>
                <div className="msg-content">
                  <div className="msg-bubble ai">
                    <div className="typing-dots"><span /><span /><span /></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {activeChar && (
        <div className="input-area">
          <div className="input-box">
            <textarea
              className="msg-input"
              rows={1}
              placeholder={`Berbicara dengan ${activeChar.name}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="input-toolbar">
              <span className="text-xs text-[var(--rp)] ml-1">{activeChar.emoji} {activeChar.name}</span>
              <button className="btn btn-sm ml-auto" style={{ background: 'var(--rp)', color: '#fff' }} onClick={handleSend} disabled={isReplying || !input.trim()}>
                {isReplying ? <div className="spinner" /> : 'Kirim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
