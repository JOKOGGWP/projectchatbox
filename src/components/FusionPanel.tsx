import { useState } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

interface FusionPanelProps {
  onCallAi: (prompt: string, modelValue?: string) => Promise<string>;
  modelOptions: { value: string; label: string }[];
  isStreaming: boolean;
}

export default function FusionPanel({ onCallAi, modelOptions, isStreaming }: FusionPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [model1, setModel1] = useState(modelOptions[0]?.value || '');
  const [model2, setModel2] = useState(modelOptions[1]?.value || modelOptions[0]?.value || '');
  const [result1, setResult1] = useState('');
  const [result2, setResult2] = useState('');
  const [merged, setMerged] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    if (!prompt.trim() || isRunning || isStreaming) return;
    setIsRunning(true);
    setResult1('');
    setResult2('');
    setMerged('');

    try {
      const [r1, r2] = await Promise.all([
        onCallAi(prompt, model1),
        onCallAi(prompt, model2),
      ]);
      setResult1(r1);
      setResult2(r2);

      if (r1 && r2) {
        const mergePrompt = `RESPON A:\n${r1}\n\nRESPON B:\n${r2}\n\nGabungkan kedua respons di atas menjadi satu respons yang komprehensif.`;
        const m = await onCallAi(mergePrompt);
        setMerged(m);
      }
    } catch (e) {
      console.error('Fusion error:', e);
    } finally {
      setIsRunning(false);
    }
  };

  const opts = modelOptions.length > 0 ? modelOptions : [{ value: 'auto', label: 'Auto' }];

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="scroll-panel">
        <div className="panel-info">
          <h3 style={{ color: 'var(--fusion)' }}>🔥 Fusion Mode</h3>
          <p>Dapatkan jawaban dari beberapa model AI sekaligus, digabungkan menjadi respons terbaik.</p>
        </div>
        <div className="fusion-config">
          <label>Model 1:</label>
          <select className="model-select" value={model1} onChange={(e) => setModel1(e.target.value)}>
            {opts.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <label>Model 2:</label>
          <select className="model-select" value={model2} onChange={(e) => setModel2(e.target.value)}>
            {opts.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button className="btn btn-sm btn-primary" onClick={handleRun} disabled={isRunning}>
            {isRunning ? <div className="spinner" /> : 'Jalankan Fusion'}
          </button>
        </div>

        {(result1 || result2) && (
          <div className="mt-4">
            <div className="fusion-grid">
              <div className="fusion-card">
                <h4>Model A</h4>
                <div
                  className="msg-bubble ai text-[13px] rounded-[10px]"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(marked(result1 || 'Gagal', { async: false }) as string, { ADD_ATTR: ['class'] }),
                  }}
                />
              </div>
              <div className="fusion-card">
                <h4>Model B</h4>
                <div
                  className="msg-bubble ai text-[13px] rounded-[10px]"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(marked(result2 || 'Gagal', { async: false }) as string, { ADD_ATTR: ['class'] }),
                  }}
                />
              </div>
            </div>
            {merged && (
              <div className="fusion-merged mt-4">
                <h4>✨ Gabungan Terbaik</h4>
                <div
                  className="text-[13px]"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(marked(merged, { async: false }) as string, { ADD_ATTR: ['class'] }),
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="input-area">
        <div className="input-box">
          <textarea
            className="msg-input"
            rows={1}
            placeholder="Tanyakan sesuatu untuk Fusion Mode..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleRun();
              }
            }}
          />
          <div className="input-toolbar">
            <span className="text-xs text-[var(--text-muted)] ml-1">Fusion menggabungkan jawaban dari 2+ AI</span>
            <button className="btn btn-sm ml-auto" style={{ background: 'var(--fusion)', color: '#fff' }} onClick={handleRun} disabled={isRunning}>
              {isRunning ? <div className="spinner" /> : 'Fusion'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
