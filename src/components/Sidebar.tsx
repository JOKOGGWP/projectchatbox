import type { Conversation } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConvId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNewChat: () => void;
  onLoadConv: (id: string) => void;
  onDeleteConv: (id: string) => void;
  onOpenSettings: (tab?: string) => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'baru';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'j';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export default function Sidebar({
  isOpen,
  onClose,
  conversations,
  activeConvId,
  searchQuery,
  onSearchChange,
  onNewChat,
  onLoadConv,
  onDeleteConv,
  onOpenSettings,
}: SidebarProps) {
  const filtered = conversations.filter((c) =>
    !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const now = Date.now();
  const groups: Record<string, Conversation[]> = {
    'Hari ini': [],
    Kemarin: [],
    'Lebih lama': [],
  };

  for (const c of filtered) {
    const d = now - c.createdAt;
    if (d < 86400000) groups['Hari ini'].push(c);
    else if (d < 172800000) groups['Kemarin'].push(c);
    else groups['Lebih lama'].push(c);
  }

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-logo">
            <div className="icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3" fill="white" />
                <circle cx="8" cy="2" r="1.5" fill="white" opacity="0.6" />
                <circle cx="8" cy="14" r="1.5" fill="white" opacity="0.6" />
                <circle cx="2" cy="8" r="1.5" fill="white" opacity="0.6" />
                <circle cx="14" cy="8" r="1.5" fill="white" opacity="0.6" />
              </svg>
            </div>
            <span>NexusChat</span>
          </div>
        </div>

        <div className="sidebar-nav">
          <button className="nav-item" onClick={onNewChat}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 1v13M1 7.5h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Chat Baru
          </button>
          <button className="nav-item" onClick={() => onOpenSettings('apis')}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <rect x="1" y="5" width="13" height="5" rx="2.5" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="4.5" cy="7.5" r="1" fill="currentColor" />
              <circle cx="7.5" cy="7.5" r="1" fill="currentColor" />
              <circle cx="10.5" cy="7.5" r="1" fill="currentColor" />
            </svg>
            API Manager
          </button>
          <button className="nav-item" onClick={() => onOpenSettings('presets')}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M2 3h11M2 6h11M2 9h8M2 12h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Model Presets
          </button>
          <button className="nav-item" onClick={() => onOpenSettings()}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2" />
              <path
                d="M7.5 1.5v1m0 10v1m6-6h-1m-10 0H1.5m8.96-4.96-.7.7M5.24 9.76l-.7.7m7.02 0-.7-.7M5.24 5.24l-.7-.7"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            Pengaturan
          </button>
        </div>

        <div className="sidebar-search">
          <div className="relative">
            <svg
              className="absolute left-[9px] top-1/2 -translate-y-1/2 text-[var(--text-dim)] pointer-events-none"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
            >
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input
              className="form-input pl-8"
              type="text"
              placeholder="Cari percakapan..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="upgrade-banner">
          <p>
            <strong style={{ color: 'var(--text-primary)' }}>NexusChat v2</strong>
            <br />
            Multi-API &middot; Sandbox &middot; Fusion &middot; Debate
          </p>
          <button className="upgrade-btn" onClick={() => onOpenSettings('apis')}>
            + Tambah API
          </button>
        </div>

        <div className="conv-section">
          {filtered.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-dim)', padding: '12px 14px' }}>
              {searchQuery ? 'Tidak ada hasil' : 'Belum ada percakapan'}
            </p>
          ) : (
            Object.entries(groups).map(
              ([label, convs]) =>
                convs.length > 0 && (
                  <div key={label}>
                    <div className="conv-section-title">{label}</div>
                    {convs.map((c) => (
                      <div
                        key={c.id}
                        className={`conv-item ${c.id === activeConvId ? 'active' : ''}`}
                        onClick={() => onLoadConv(c.id)}
                      >
                        <div className="conv-item-info">
                          <div className="conv-item-title">{c.title}</div>
                          <div className="conv-item-meta">
                            <span>{c.messages.length} pesan</span>
                            <span>&middot;</span>
                            <span>{formatTime(c.createdAt)}</span>
                          </div>
                        </div>
                        <button
                          className="conv-del-btn"
                          title="Hapus"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConv(c.id);
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )
            )
          )}
        </div>
      </aside>
    </>
  );
}
