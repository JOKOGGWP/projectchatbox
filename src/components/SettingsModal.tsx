import { useState } from 'react';
import type { ApiProvider, ModelPreset, RpCharacter, AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
  settings: AppSettings;
  onSaveSettings: (s: AppSettings) => void;
  apiProviders: ApiProvider[];
  onAddApi: (api: Omit<ApiProvider, 'id' | 'lastStatus' | 'failCount'>) => void;
  onRemoveApi: (id: string) => void;
  onToggleApi: (id: string) => void;
  onTestApis: () => void;
  presets: ModelPreset[];
  onAddPreset: (p: Omit<ModelPreset, 'id'>) => void;
  onRemovePreset: (id: string) => void;
  rpChars: RpCharacter[];
  onAddRpChar: (c: Omit<RpCharacter, 'id'>) => void;
  onRemoveRpChar: (id: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onClearChats: () => void;
  onClearAll: () => void;
}

const DEFAULT_URLS: Record<string, string> = {
  openrouter: 'https://openrouter.ai/api/v1',
  openai: 'https://api.openai.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
  nvidia: 'https://integrate.api.nvidia.com/v1',
  custom: '',
};

export default function SettingsModal({
  isOpen,
  onClose,
  initialTab = 'keys',
  settings,
  onSaveSettings,
  apiProviders,
  onAddApi,
  onRemoveApi,
  onToggleApi,
  presets,
  onAddPreset,
  onRemovePreset,
  rpChars,
  onAddRpChar,
  onRemoveRpChar,
  onExport,
  onClearChats,
  onClearAll,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // API form
  const [apiName, setApiName] = useState('');
  const [apiType, setApiType] = useState<ApiProvider['type']>('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [apiModel, setApiModel] = useState('');

  // Preset form
  const [presetName, setPresetName] = useState('');
  const [presetModel, setPresetModel] = useState('');
  const [presetProvider, setPresetProvider] = useState('');
  const [presetIcon, setPresetIcon] = useState('');

  // RP form
  const [rpName, setRpName] = useState('');
  const [rpEmoji, setRpEmoji] = useState('');
  const [rpDesc, setRpDesc] = useState('');

  // Model settings
  const [temp, setTemp] = useState(settings.temperature);
  const [topP, setTopP] = useState(settings.topP);
  const [maxTokens, setMaxTokens] = useState(settings.maxTokens);
  const [sysPrompt, setSysPrompt] = useState(settings.systemPrompt);

  if (!isOpen) return null;

  const handleAddApi = () => {
    if (!apiName || !apiKey) return;
    onAddApi({
      name: apiName,
      type: apiType,
      key: apiKey,
      baseUrl: apiBaseUrl || DEFAULT_URLS[apiType] || '',
      model: apiModel,
      active: true,
    });
    setApiName('');
    setApiKey('');
    setApiBaseUrl('');
    setApiModel('');
  };

  const handleAddPreset = () => {
    if (!presetName || !presetModel || !presetProvider) return;
    onAddPreset({
      name: presetName,
      model: presetModel,
      providerId: presetProvider,
      icon: presetIcon || '🤖',
    });
    setPresetName('');
    setPresetModel('');
    setPresetIcon('');
  };

  const handleAddRp = () => {
    if (!rpName || !rpDesc) return;
    onAddRpChar({
      name: rpName,
      emoji: rpEmoji || '🎭',
      prompt: rpDesc,
    });
    setRpName('');
    setRpEmoji('');
    setRpDesc('');
  };

  const handleSaveModel = () => {
    onSaveSettings({
      ...settings,
      temperature: temp,
      topP,
      maxTokens,
      systemPrompt: sysPrompt,
    });
  };

  const tabs = [
    { key: 'keys', label: 'API Keys' },
    { key: 'apis', label: 'API Manager' },
    { key: 'presets', label: 'Model Presets' },
    { key: 'model', label: 'Model' },
    { key: 'rp', label: 'RP Chars' },
    { key: 'data', label: 'Data' },
  ];

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 'min(640px, calc(100% - 32px))' }}>
        <div className="modal-header">
          <span className="modal-title">Pengaturan</span>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`modal-tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="modal-body">
          {activeTab === 'apis' && (
            <>
              <div className="form-group">
                <label className="form-label">Tambah API Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="form-input"
                    placeholder="Nama (misal: OpenRouter 1)"
                    value={apiName}
                    onChange={(e) => setApiName(e.target.value)}
                  />
                  <select
                    className="form-input"
                    value={apiType}
                    onChange={(e) => setApiType(e.target.value as ApiProvider['type'])}
                  >
                    <option value="openrouter">OpenRouter</option>
                    <option value="openai">OpenAI-Compatible</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="nvidia">NVIDIA AI</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <input
                  className="form-input mt-1.5"
                  type="password"
                  placeholder="API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <input
                  className="form-input mt-1.5"
                  placeholder="Base URL (opsional)"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                />
                <input
                  className="form-input mt-1.5"
                  placeholder="Default Model (opsional)"
                  value={apiModel}
                  onChange={(e) => setApiModel(e.target.value)}
                />
                <div className="flex gap-2 mt-2">
                  <button className="btn btn-primary" onClick={handleAddApi}>
                    + Tambah API
                  </button>
                </div>
              </div>
              <div className="h-px bg-[var(--border-color)] my-1" />
              <label className="form-label">Daftar API Providers ({apiProviders.length})</label>
              <div className="api-list">
                {apiProviders.map((api) => (
                  <div key={api.id} className={`api-item ${api.active ? 'active' : ''} ${api.lastStatus === 'failed' ? 'failed' : ''}`}>
                    <div
                      className={`api-status ${api.lastStatus === 'ok' ? 'ok' : api.lastStatus === 'failed' ? 'fail' : 'unk'}`}
                    />
                    <div className="api-info">
                      <div className="api-name">
                        {api.name} {api.model && <span className="text-[var(--text-dim)] font-normal">({api.model})</span>}
                      </div>
                      <div className="api-meta">
                        {api.type} &middot; {api.active ? 'Aktif' : 'Nonaktif'}
                      </div>
                    </div>
                    <div className="api-actions">
                      <button className="api-btn" onClick={() => onToggleApi(api.id)}>
                        {api.active ? 'Off' : 'On'}
                      </button>
                      <button className="api-btn" style={{ color: 'var(--error)' }} onClick={() => onRemoveApi(api.id)}>
                        Del
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'presets' && (
            <>
              <div className="form-group">
                <label className="form-label">Tambah Model Preset</label>
                <input className="form-input" placeholder="Nama preset" value={presetName} onChange={(e) => setPresetName(e.target.value)} />
                <input className="form-input mt-1.5" placeholder="Model ID (misal: openai/gpt-4o)" value={presetModel} onChange={(e) => setPresetModel(e.target.value)} />
                <select className="form-input mt-1.5" value={presetProvider} onChange={(e) => setPresetProvider(e.target.value)}>
                  <option value="">Pilih Provider API...</option>
                  {apiProviders.filter((a) => a.active).map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <input className="form-input mt-1.5" placeholder="Emoji icon (opsional)" maxLength={2} value={presetIcon} onChange={(e) => setPresetIcon(e.target.value)} />
                <div className="flex gap-2 mt-2">
                  <button className="btn btn-primary" onClick={handleAddPreset}>+ Tambah Preset</button>
                </div>
              </div>
              <div className="h-px bg-[var(--border-color)] my-1" />
              <label className="form-label">Daftar Presets ({presets.length})</label>
              <div className="preset-list">
                {presets.map((p) => (
                  <div key={p.id} className="preset-item">
                    <div className="preset-icon">{p.icon}</div>
                    <div className="preset-info">
                      <div className="preset-name">{p.name}</div>
                      <div className="preset-meta">{p.model}</div>
                    </div>
                    <div className="api-actions">
                      <button className="api-btn" style={{ color: 'var(--error)' }} onClick={() => onRemovePreset(p.id)}>Del</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'model' && (
            <>
              <div className="form-group">
                <label className="form-label">Temperature <span className="text-[var(--text-muted)] ml-1 text-xs">{temp}</span></label>
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={2} step={0.05} value={temp} onChange={(e) => setTemp(parseFloat(e.target.value))} className="flex-1 accent-[var(--accent)]" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Top P <span className="text-[var(--text-muted)] ml-1 text-xs">{topP}</span></label>
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={1} step={0.05} value={topP} onChange={(e) => setTopP(parseFloat(e.target.value))} className="flex-1 accent-[var(--accent)]" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Max Tokens <span className="text-[var(--text-muted)] ml-1 text-xs">{maxTokens}</span></label>
                <div className="flex items-center gap-3">
                  <input type="range" min={256} max={8192} step={256} value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value))} className="flex-1 accent-[var(--accent)]" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">System Prompt</label>
                <textarea className="form-input min-h-[80px] resize-y font-inherit leading-relaxed" value={sysPrompt} onChange={(e) => setSysPrompt(e.target.value)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="toggle-label">Streaming response</span>
                <button
                  className={`toggle ${settings.streaming ? 'on' : ''}`}
                  onClick={() => onSaveSettings({ ...settings, streaming: !settings.streaming })}
                />
              </div>
              <div className="h-px bg-[var(--border-color)] my-1" />
              <div className="flex items-center justify-between mt-2">
                <div>
                  <span className="toggle-label" style={{ color: '#ff6b9d' }}>NSFW Mode</span>
                  <div className="text-[11px] text-[var(--text-dim)] mt-0.5">Izinkan konten dewasa/mature</div>
                </div>
                <button
                  className={`toggle ${settings.nsfwMode ? 'on' : ''}`}
                  onClick={() => onSaveSettings({ ...settings, nsfwMode: !settings.nsfwMode })}
                />
              </div>
              <button className="btn btn-primary mt-2" onClick={handleSaveModel}>Simpan</button>
            </>
          )}

          {activeTab === 'rp' && (
            <>
              <div className="form-group">
                <label className="form-label">Tambah Karakter RP</label>
                <input className="form-input" placeholder="Nama karakter" value={rpName} onChange={(e) => setRpName(e.target.value)} />
                <input className="form-input mt-1.5" placeholder="Emoji (misal: 🧙‍♂️)" maxLength={2} value={rpEmoji} onChange={(e) => setRpEmoji(e.target.value)} />
                <textarea className="form-input min-h-[80px] resize-y font-inherit leading-relaxed mt-1.5" placeholder="Deskripsi karakter, personality, gaya bicara..." value={rpDesc} onChange={(e) => setRpDesc(e.target.value)} />
                <div className="flex gap-2 mt-2">
                  <button className="btn btn-primary" onClick={handleAddRp}>+ Tambah Karakter</button>
                </div>
              </div>
              <div className="h-px bg-[var(--border-color)] my-1" />
              <label className="form-label">Daftar Karakter ({rpChars.length})</label>
              <div className="preset-list">
                {rpChars.map((c) => (
                  <div key={c.id} className="preset-item">
                    <div className="preset-icon">{c.emoji}</div>
                    <div className="preset-info">
                      <div className="preset-name">{c.name}</div>
                      <div className="preset-meta">{c.prompt.slice(0, 60)}...</div>
                    </div>
                    <div className="api-actions">
                      <button className="api-btn" style={{ color: 'var(--error)' }} onClick={() => onRemoveRpChar(c.id)}>Del</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'data' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="toggle-label font-medium">Simpan Riwayat Chat</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">Percakapan disimpan di localStorage</div>
                </div>
                <button
                  className={`toggle ${settings.saveHistory ? 'on' : ''}`}
                  onClick={() => onSaveSettings({ ...settings, saveHistory: !settings.saveHistory })}
                />
              </div>
              <div className="h-px bg-[var(--border-color)] my-2" />
              <div className="form-group">
                <label className="form-label font-medium text-[var(--text-primary)]">Export / Import</label>
                <div className="flex gap-2 flex-wrap">
                  <button className="btn btn-ghost" onClick={onExport}>Export JSON</button>
                </div>
              </div>
              <div className="h-px bg-[var(--border-color)] my-2" />
              <div className="form-group">
                <label className="form-label font-medium text-[var(--text-primary)] mb-1">Zona Bahaya</label>
                <div className="flex gap-2 flex-wrap">
                  <button className="btn btn-danger" onClick={onClearChats}>Hapus Semua Chat</button>
                  <button className="btn btn-danger" onClick={onClearAll}>Hapus Semua Data</button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'keys' && (
            <>
              <div className="bg-[rgba(124,106,247,0.08)] border border-[rgba(124,106,247,0.2)] rounded-lg p-2.5 text-xs text-[var(--text-muted)] mb-3">
                Gunakan tab <strong>API Manager</strong> untuk fitur multi-API dan auto-failover.
              </div>
              <p className="text-sm text-[var(--text-muted)]">API Keys diatur melalui API Manager tab.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
