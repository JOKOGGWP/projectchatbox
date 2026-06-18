import { useState } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

interface DebatePanelProps {
  onCallAi: (messages: Array<{ role: string; content: string }>) => Promise<string>;
  modelOptions: { value: string; label: string }[];
  isStreaming: boolean;
}

const DEBATE_PROMPT_PRO = 'Kamu berada dalam mode debat. Argumenkan SANGAT KUAT untuk topik yang diberikan.';
const DEBATE_PROMPT_CONTRA = 'Kamu berada dalam mode debat. Argumenkan SANGAT KUAT MENENTANG topik yang diberikan.';

export default function DebatePanel({ onCallAi, modelOptions, isStreaming }: DebatePanelProps) {
  const [topic, setTopic] = useState('');
  const [mPro, setMPro] = useState(modelOptions[0]?.value || '');
  const [mContra, setMContra] = useState(modelOptions[1]?.value || modelOptions[0]?.value || '');
  const [rounds, setRounds] = useState(3);
  const [debateHtml, setDebateHtml] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const opts = modelOptions.length > 0 ? modelOptions : [{ value: 'auto', label: 'Auto' }];

  const handleRun = async () => {
    if (!topic.trim() || isRunning || isStreaming) return;
    setIsRunning(true);
    setDebateHtml('');

    let html = `<div class="flex items-center justify-center gap-3 py-2"><span style="color:var(--success);font-weight:700;font-size:14px">PRO</span><div class="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-1 text-xs text-[var(--text-muted)] font-bold">VS</div><span style="color:var(--error);font-weight:700;font-size:14px">CONTRA</span></div>`;
    html += `<div class="text-center text-[13px] text-[var(--text-muted)] mb-4 p-2.5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]"><strong>Topik:</strong> ${escapeHtml(topic)}</div>`;

    try {
      for (let round = 1; round <= rounds; round++) {
        const proMsgs = [
          { role: 'system', content: DEBATE_PROMPT_PRO },
          { role: 'user', content: `Topik debat: "${topic}". Ronde ${round}. Argumenkan MENDUKUNG.` },
        ];
        let proResp = '';
        try { proResp = await onCallAi(proMsgs); } catch { proResp = '(Gagal)'; }

        html += `<div class="debate-round"><h4>Ronde ${round} — PRO (Mendukung)</h4><div class="msg-bubble ai-debate text-[13px] rounded-[10px]" style="border-color:rgba(249,115,22,0.25)">${DOMPurify.sanitize(marked(proResp, { async: false }) as string, { ADD_ATTR: ['class'] })}</div></div>`;
        setDebateHtml(html);

        const contraMsgs = [
          { role: 'system', content: DEBATE_PROMPT_CONTRA },
          { role: 'user', content: `Topik debat: "${topic}". Ronde ${round}. Argumenkan MENENTANG.` },
        ];
        let contraResp = '';
        try { contraResp = await onCallAi(contraMsgs); } catch { contraResp = '(Gagal)'; }

        html += `<div class="debate-round" style="border-color:rgba(239,68,68,0.3)"><h4 style="color:var(--error)">Ronde ${round} — CONTRA (Menentang)</h4><div class="msg-bubble ai-debate text-[13px] rounded-[10px]" style="border-color:rgba(239,68,68,0.3)">${DOMPurify.sanitize(marked(contraResp, { async: false }) as string, { ADD_ATTR: ['class'] })}</div></div>`;
        setDebateHtml(html);
      }

      html += `<div class="fusion-merged mt-4"><h4>Kesimpulan Debat</h4><div class="text-[13px] text-[var(--text-muted)]">Debat selesai setelah ${rounds} ronde. Kedua AI telah menyajikan argumen pro dan kontra.</div></div>`;
      setDebateHtml(html);
    } catch (e) {
      console.error('Debate error:', e);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="scroll-panel">
        <div className="panel-info">
          <h3 style={{ color: 'var(--debate)' }}>⚔️ Debate Mode</h3>
          <p>Dua AI akan berdebat tentang topik yang Anda berikan. Setiap AI memiliki sudut pandang berbeda.</p>
        </div>
        <div className="debate-config">
          <label>AI Pro:</label>
          <select className="model-select" value={mPro} onChange={(e) => setMPro(e.target.value)}>
            {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <label>AI Contra:</label>
          <select className="model-select" value={mContra} onChange={(e) => setMContra(e.target.value)}>
            {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <label>Ronde:</label>
          <select className="model-select" value={rounds} onChange={(e) => setRounds(parseInt(e.target.value))}>
            {[2, 3, 4, 5].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button className="btn btn-sm" style={{ background: 'var(--debate)', color: '#fff' }} onClick={handleRun} disabled={isRunning}>
            {isRunning ? <div className="spinner" /> : 'Mulai Debat'}
          </button>
        </div>
        {debateHtml && (
          <div className="mt-4" dangerouslySetInnerHTML={{ __html: debateHtml }} />
        )}
      </div>

      <div className="input-area">
        <div className="input-box">
          <textarea
            className="msg-input"
            rows={1}
            placeholder="Topik debat, misalnya: 'AI akan menggantikan pekerjaan manusia'..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleRun();
              }
            }}
          />
          <div className="input-toolbar">
            <span className="text-xs text-[var(--text-muted)] ml-1">Dua AI akan berdebat tentang topik ini</span>
            <button className="btn btn-sm ml-auto" style={{ background: 'var(--debate)', color: '#fff' }} onClick={handleRun} disabled={isRunning}>
              {isRunning ? <div className="spinner" /> : 'Mulai Debat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
