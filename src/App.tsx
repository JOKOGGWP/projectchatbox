import { useState, useCallback, useRef } from 'react';
import type { Conversation, ApiProvider, ModelPreset, RpCharacter, TabType, AppSettings, Message } from './types';
import { useLocalStorage } from './hooks/useStorage';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import SettingsModal from './components/SettingsModal';
import SandboxPanel from './components/SandboxPanel';
import FusionPanel from './components/FusionPanel';
import DebatePanel from './components/DebatePanel';
import RpPanel from './components/RpPanel';
import Toast from './components/Toast';

interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warn' | 'info';
}

const DEFAULT_SETTINGS: AppSettings = {
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048,
  systemPrompt: 'Kamu adalah NexusChat, asisten AI yang cerdas, helpful, dan ramah. Jawab dalam bahasa yang sama dengan pengguna.',
  streaming: true,
  saveHistory: true,
  nsfwMode: false,
  failoverEnabled: true,
  webSearchEnabled: false,
  ttsEnabled: false,
};

const NSFW_PROMPT = '\n\n[MODE NSFW AKTIF] Kamu diizinkan untuk membahas topik dewasa, mature, dan NSFW secara terbuka tanpa sensor.';

export default function App() {
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Tab state
  const [currentTab, setCurrentTab] = useState<TabType>('ask');

  // Settings
  const [settings, setSettings] = useLocalStorage<AppSettings>('nexuschat_settings', DEFAULT_SETTINGS);

  // API Providers
  const [apiProviders, setApiProviders] = useLocalStorage<ApiProvider[]>('nexuschat_apis', []);

  // Presets
  const [presets, setPresets] = useLocalStorage<ModelPreset[]>('nexuschat_presets', []);

  // RP Characters
  const [rpChars, setRpChars] = useLocalStorage<RpCharacter[]>('nexuschat_rpchars', []);

  // Conversations
  const [conversations, setConversations] = useLocalStorage<Conversation[]>('nexuschat_convs', []);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  // Chat state
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  // Settings modal
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('keys');

  // Toasts
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toast = useCallback((msg: string, type: ToastData['type'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message: msg, type }]);
  }, []);

  const activeConv = conversations.find((c) => c.id === activeConvId) || null;

  const getActiveApi = useCallback((): ApiProvider | null => {
    const active = apiProviders.filter((a) => a.active);
    if (active.length === 0) return null;
    return active.find((a) => a.lastStatus !== 'failed') || active[0];
  }, [apiProviders]);

  const buildMessages = useCallback(
    (msgs: Message[], searchCtx?: string, extraSystem?: string): Array<{ role: string; content: string }> => {
      const result: Array<{ role: string; content: string }> = [];
      let sys = settings.systemPrompt;
      if (settings.webSearchEnabled && searchCtx) sys += `\n\n## Hasil Web Search:\n${searchCtx}`;
      if (settings.nsfwMode) sys += NSFW_PROMPT;
      if (extraSystem) sys += `\n\n${extraSystem}`;
      result.push({ role: 'system', content: sys });
      for (const m of msgs) {
        result.push({ role: m.role, content: m.content });
      }
      return result;
    },
    [settings]
  );

  const fetchChat = useCallback(
    async (messages: Array<{ role: string; content: string }>, api?: ApiProvider | null): Promise<string> => {
      const provider = api || getActiveApi();
      if (!provider) throw new Error('No API provider configured');

      const res = await fetch(`${provider.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.key}`,
        },
        body: JSON.stringify({
          model: provider.model || 'meta-llama/llama-3.1-8b-instruct:free',
          messages,
          temperature: settings.temperature,
          top_p: settings.topP,
          max_tokens: settings.maxTokens,
          stream: false,
        }),
        signal: abortRef.current?.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`${res.status}: ${err?.error?.message || res.statusText}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    },
    [getActiveApi, settings]
  );

  const streamChat = useCallback(
    async (messages: Array<{ role: string; content: string }>, onChunk: (text: string) => void): Promise<string> => {
      const provider = getActiveApi();
      if (!provider) throw new Error('No API provider configured');

      const res = await fetch(`${provider.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.key}`,
        },
        body: JSON.stringify({
          model: provider.model || 'meta-llama/llama-3.1-8b-instruct:free',
          messages,
          temperature: settings.temperature,
          top_p: settings.topP,
          max_tokens: settings.maxTokens,
          stream: true,
        }),
        signal: abortRef.current?.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`${res.status}: ${err?.error?.message || res.statusText}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      if (!reader) throw new Error('No reader');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') break;
          try {
            const p = JSON.parse(raw);
            const d = p.choices?.[0]?.delta?.content;
            if (d) {
              fullText += d;
              onChunk(fullText);
            }
          } catch { /* ignore */ }
        }
      }
      return fullText;
    },
    [getActiveApi, settings]
  );

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if ((!text && attachedFiles.length === 0) || isStreaming) return;

    let conv = activeConv;
    if (!conv) {
      const newConv: Conversation = {
        id: 'conv_' + Date.now(),
        title: text.slice(0, 40) + (text.length > 40 ? '...' : '') || 'Chat Baru',
        messages: [],
        createdAt: Date.now(),
      };
      conv = newConv;
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
    }

    // Process files
    let userContent = text;
    for (const f of attachedFiles) {
      if (f.type.startsWith('image/')) {
        const b64 = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.onerror = rej;
          r.readAsDataURL(f);
        });
        userContent += `\n\n[Image: ${f.name}]\n${b64}`;
      } else {
        const txt = await f.text();
        userContent += `\n\n[File: ${f.name}]\n\`\`\`\n${txt}\n\`\`\``;
      }
    }

    const userMsg: Message = { role: 'user', content: userContent, timestamp: Date.now() };
    const updatedMsgs = [...conv.messages, userMsg];
    setConversations((prev) => prev.map((c) => (c.id === conv!.id ? { ...c, messages: updatedMsgs, title: c.messages.length === 0 && text ? text.slice(0, 40) + (text.length > 40 ? '...' : '') : c.title } : c)));
    setInputValue('');
    setAttachedFiles([]);

    // Check API key
    const api = getActiveApi();
    if (!api) {
      const errMsg: Message = { role: 'assistant', content: '**API key belum diatur.** Buka Pengaturan → API Manager dan tambahkan API provider.', timestamp: Date.now() };
      setConversations((prev) => prev.map((c) => (c.id === conv!.id ? { ...c, messages: [...c.messages, errMsg] } : c)));
      toast('API key belum diatur', 'warn');
      return;
    }

    setIsStreaming(true);
    setIsTyping(true);
    setStreamingText('');
    abortRef.current = new AbortController();

    try {
      const apiMessages = buildMessages(updatedMsgs);

      if (settings.streaming) {
        setIsTyping(false);
        let streamed = '';
        await streamChat(apiMessages, (chunk) => {
          streamed = chunk;
          setStreamingText(chunk);
        });
        const aiMsg: Message = { role: 'assistant', content: streamed, timestamp: Date.now(), searchUsed: settings.webSearchEnabled, nsfwMode: settings.nsfwMode };
        setConversations((prev) => prev.map((c) => (c.id === conv!.id ? { ...c, messages: [...c.messages, aiMsg] } : c)));
      } else {
        setIsTyping(true);
        const resp = await fetchChat(apiMessages);
        setIsTyping(false);
        const aiMsg: Message = { role: 'assistant', content: resp, timestamp: Date.now(), searchUsed: settings.webSearchEnabled, nsfwMode: settings.nsfwMode };
        setConversations((prev) => prev.map((c) => (c.id === conv!.id ? { ...c, messages: [...c.messages, aiMsg] } : c)));
      }
    } catch (err: any) {
      setIsTyping(false);
      if (err.name === 'AbortError') {
        if (streamingText) {
          const partialMsg: Message = { role: 'assistant', content: streamingText, timestamp: Date.now() };
          setConversations((prev) => prev.map((c) => (c.id === conv!.id ? { ...c, messages: [...c.messages, partialMsg] } : c)));
        }
        toast('Respons dibatalkan', 'warn');
      } else {
        let errMsg = '**Terjadi kesalahan:** ' + (err.message || 'Unknown error');
        if (err.message?.includes('401') || err.message?.includes('403')) errMsg = '**API key tidak valid.** Periksa di Pengaturan → API Manager.';
        else if (err.message?.includes('404')) errMsg = '**Model tidak tersedia.** Coba ganti model di API Manager. Model gratis yang tersedia: `meta-llama/llama-3.1-8b-instruct:free` atau `meta-llama/llama-3.1-70b-instruct:free`';
        else if (err.message?.includes('429')) errMsg = '**Rate limit tercapai.** Coba lagi nanti.';
        else if (err.message?.includes('fetch')) errMsg = '**Koneksi gagal.** Periksa koneksi internet Anda.';

        const aiErr: Message = { role: 'assistant', content: errMsg, timestamp: Date.now() };
        setConversations((prev) => prev.map((c) => (c.id === conv!.id ? { ...c, messages: [...c.messages, aiErr] } : c)));
        toast(errMsg.replace(/\*\*/g, '').slice(0, 50), 'error');
      }
    } finally {
      setIsStreaming(false);
      setIsTyping(false);
      setStreamingText('');
      abortRef.current = null;
    }
  }, [inputValue, attachedFiles, isStreaming, activeConv, getActiveApi, buildMessages, streamChat, fetchChat, settings, toast, streamingText]);

  const handleCancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  const handleNewChat = useCallback(() => {
    const newConv: Conversation = {
      id: 'conv_' + Date.now(),
      title: 'Chat Baru',
      messages: [],
      createdAt: Date.now(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
    setCurrentTab('ask');
    setSidebarOpen(false);
  }, [setConversations]);

  const handleLoadConv = useCallback((id: string) => {
    setActiveConvId(id);
    setCurrentTab('ask');
    setSidebarOpen(false);
  }, []);

  const handleDeleteConv = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) setActiveConvId(null);
  }, [setConversations, activeConvId]);

  const handleRegenerate = useCallback(() => {
    if (!activeConv) return;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeConv.id) return c;
        const msgs = [...c.messages];
        while (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') msgs.pop();
        return { ...c, messages: msgs };
      })
    );
    // Re-trigger send
    handleSend();
  }, [activeConv, handleSend]);

  const modelOptions = [
    { value: 'auto', label: 'Auto' },
    ...presets.map((p) => ({ value: `preset:${p.id}`, label: `${p.icon} ${p.name}` })),
    ...apiProviders.filter((a) => a.active).map((a) => ({ value: `api:${a.id}`, label: a.name })),
  ];

  // Generic AI call for panels
  const handlePanelAiCall = useCallback(
    async (prompt: string, systemPrompt?: string): Promise<string> => {
      const msgs: Array<{ role: string; content: string }> = [];
      if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt });
      msgs.push({ role: 'user', content: prompt });
      return fetchChat(msgs);
    },
    [fetchChat]
  );

  const handlePanelAiCallWithMessages = useCallback(
    async (messages: Array<{ role: string; content: string }>): Promise<string> => {
      return fetchChat(messages);
    },
    [fetchChat]
  );

  const handleExport = useCallback(() => {
    const data = {
      version: '2.1',
      exported: new Date().toISOString(),
      conversations,
      settings: { ...settings, apiKeys: { openrouter: '***', gemini: '***' } },
      apis: apiProviders.map((a) => ({ ...a, key: '***' })),
      presets,
      rpChars,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexuschat_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Data berhasil diekspor!', 'success');
  }, [conversations, settings, apiProviders, presets, rpChars, toast]);

  return (
    <div className="app-container">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeConvId={activeConvId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewChat={handleNewChat}
        onLoadConv={handleLoadConv}
        onDeleteConv={handleDeleteConv}
        onOpenSettings={(tab) => {
          setSettingsTab(tab || 'keys');
          setSettingsOpen(true);
          setSidebarOpen(false);
        }}
      />

      <div className="main-content">
        <Topbar
          currentTab={currentTab}
          onSwitchTab={setCurrentTab}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleNSFW={() => setSettings((s) => ({ ...s, nsfwMode: !s.nsfwMode }))}
          onToggleWebSearch={() => setSettings((s) => ({ ...s, webSearchEnabled: !s.webSearchEnabled }))}
          onOpenSettings={() => { setSettingsTab('keys'); setSettingsOpen(true); }}
          onNewChat={handleNewChat}
          nsfwEnabled={settings.nsfwMode}
          webSearchEnabled={settings.webSearchEnabled}
        />

        {currentTab === 'ask' && (
          <>
            <ChatArea
              messages={activeConv?.messages || []}
              isStreaming={isStreaming}
              isTyping={isTyping}
              streamingText={streamingText}
              onRegenerate={handleRegenerate}
              onEditMessage={() => {}}
              onCopyMessage={() => {}}
            />
            <InputArea
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              onCancel={handleCancel}
              isStreaming={isStreaming}
              modelValue="auto"
              onModelChange={() => {}}
              onFileSelect={(files) => {
                if (files) setAttachedFiles((prev) => [...prev, ...Array.from(files)]);
              }}
              attachedFiles={attachedFiles}
              onRemoveFile={(idx) => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
            />
          </>
        )}

        {currentTab === 'sandbox' && (
          <SandboxPanel onSendToAi={handlePanelAiCall} isStreaming={isStreaming} />
        )}

        {currentTab === 'fusion' && (
          <FusionPanel onCallAi={handlePanelAiCall} modelOptions={modelOptions} isStreaming={isStreaming} />
        )}

        {currentTab === 'debate' && (
          <DebatePanel onCallAi={handlePanelAiCallWithMessages} modelOptions={modelOptions} isStreaming={isStreaming} />
        )}

        {currentTab === 'rp' && (
          <RpPanel
            characters={rpChars}
            onAddChar={(c) => setRpChars((prev) => [...prev, { ...c, id: 'rp_' + Date.now() }])}
            onRemoveChar={(id) => setRpChars((prev) => prev.filter((c) => c.id !== id))}
            onCallAi={handlePanelAiCallWithMessages}
            modelOptions={modelOptions}
            isStreaming={isStreaming}
          />
        )}
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialTab={settingsTab}
        settings={settings}
        onSaveSettings={setSettings}
        apiProviders={apiProviders}
        onAddApi={(api) => setApiProviders((prev) => [...prev, { ...api, id: 'api_' + Date.now(), lastStatus: 'unknown', failCount: 0 }])}
        onRemoveApi={(id) => setApiProviders((prev) => prev.filter((a) => a.id !== id))}
        onToggleApi={(id) => setApiProviders((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)))}
        onTestApis={() => {}}
        presets={presets}
        onAddPreset={(p) => setPresets((prev) => [...prev, { ...p, id: 'preset_' + Date.now() }])}
        onRemovePreset={(id) => setPresets((prev) => prev.filter((p) => p.id !== id))}
        rpChars={rpChars}
        onAddRpChar={(c) => setRpChars((prev) => [...prev, { ...c, id: 'rp_' + Date.now() }])}
        onRemoveRpChar={(id) => setRpChars((prev) => prev.filter((c) => c.id !== id))}
        onExport={handleExport}
        onImport={() => {}}
        onClearChats={() => {
          setConversations([]);
          setActiveConvId(null);
          toast('Semua chat dihapus', 'warn');
        }}
        onClearAll={() => {
          localStorage.clear();
          window.location.reload();
        }}
      />

      <div className="toast-container">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </div>
  );
}
