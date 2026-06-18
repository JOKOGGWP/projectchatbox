import type { TabType } from '../types';

interface TopbarProps {
  currentTab: TabType;
  onSwitchTab: (tab: TabType) => void;
  onToggleSidebar: () => void;
  onToggleNSFW: () => void;
  onToggleWebSearch: () => void;
  onOpenSettings: () => void;
  onNewChat: () => void;
  nsfwEnabled: boolean;
  webSearchEnabled: boolean;
}

export default function Topbar({
  currentTab,
  onSwitchTab,
  onToggleSidebar,
  onToggleNSFW,
  onToggleWebSearch,
  onOpenSettings,
  onNewChat,
  nsfwEnabled,
  webSearchEnabled,
}: TopbarProps) {
  const tabs: { key: TabType; label: string }[] = [
    { key: 'ask', label: 'Ask' },
    { key: 'fusion', label: 'Fusion' },
    { key: 'debate', label: 'Debate' },
    { key: 'rp', label: 'RP' },
    { key: 'sandbox', label: 'Sandbox' },
  ];

  return (
    <div className="topbar">
      <button className="input-icon-btn" onClick={onToggleSidebar} title="Menu">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      <div className="tab-group">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${currentTab === t.key ? 'active' : ''}`}
            data-tab={t.key}
            onClick={() => onSwitchTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          className={`input-icon-btn ${nsfwEnabled ? 'nsfw-active' : ''}`}
          onClick={onToggleNSFW}
          title="NSFW Mode (18+)"
          style={
            nsfwEnabled
              ? { color: '#ff6b9d', background: 'rgba(255,107,157,0.12)', fontWeight: 700, fontSize: 10 }
              : {}
          }
        >
          <span style={{ fontSize: 10, fontWeight: 700 }}>18+</span>
        </button>
        <button
          className={`input-icon-btn ${webSearchEnabled ? 'active' : ''}`}
          onClick={onToggleWebSearch}
          title="Web Search"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M12 12l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
        <button className="input-icon-btn" onClick={onOpenSettings} title="Pengaturan">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M8 1v1.5m0 11V15m7-7h-1.5m-11 0H1m5.46-4.96L5.4 4.4m5.2 7.2-1.06-1.06M12.54 9.54l1.06 1.06M2.4 5.46 3.46 6.52"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          className="flex items-center gap-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-muted)] rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all"
          onClick={onNewChat}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Baru
        </button>
      </div>
    </div>
  );
}
