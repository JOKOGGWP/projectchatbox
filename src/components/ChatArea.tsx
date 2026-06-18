import { useEffect, useRef } from 'react';
import type { Message } from '../types';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.min.css';

interface ChatAreaProps {
  messages: Message[];
  isStreaming: boolean;
  isTyping: boolean;
  streamingText: string;
  onRegenerate: () => void;
  onEditMessage: (idx: number) => void;
  onCopyMessage: (idx: number) => void;
}

const MAX_VISIBLE_MSGS = 100;

function BubbleContent({
  msg,
  onRegenerate,
}: {
  msg: Message;
  onRegenerate: () => void;
}) {
  const isUser = msg.role === 'user';

  useEffect(() => {
    if (!isUser) {
      hljs.highlightAll();
    }
  }, [msg.content, isUser]);

  if (isUser) {
    return (
      <>
        <div className="msg-bubble user">
          <div className="whitespace-pre-wrap break-words">{msg.content}</div>
          {msg.images && msg.images.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              {msg.images.map((img, i) => (
                <img
                  key={i}
                  src={img.image_url.url}
                  alt="attachment"
                  className="max-w-[200px] rounded-lg"
                />
              ))}
            </div>
          )}
        </div>
        <div className="msg-actions justify-end">
          <button className="msg-action-btn" title="Edit">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M8 2l2 2-6 6H2V8z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            Edit
          </button>
        </div>
      </>
    );
  }

  let badges = null;
  if (msg.searchUsed || msg.nsfwMode || msg.failoverUsed) {
    badges = (
      <div className="flex flex-wrap gap-1">
        {msg.searchUsed && (
          <span className="search-badge">
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>{' '}
            Web search
          </span>
        )}
        {msg.nsfwMode && <span className="nsfw-badge">NSFW Mode</span>}
        {msg.failoverUsed && <span className="failover-badge">Auto-Failover</span>}
      </div>
    );
  }

  const rawHtml = marked(msg.content || '', { async: false }) as string;
  const clean = DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['class'] });

  return (
    <>
      {badges}
      <div className="msg-bubble ai">
        <div dangerouslySetInnerHTML={{ __html: clean }} />
      </div>
      <div className="msg-actions">
        <button
          className="msg-action-btn"
          title="Salin"
          onClick={() => navigator.clipboard.writeText(msg.content)}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M3 8H2a1 1 0 01-1-1V2a1 1 0 011-1h5a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Copy
        </button>
        <button className="msg-action-btn" onClick={onRegenerate} title="Ulangi">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 6A4 4 0 0110 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M10 6A4 4 0 012 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M9 1.5l1 2-2 .5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Regen
        </button>
      </div>
    </>
  );
}

export default function ChatArea({
  messages,
  isStreaming,
  isTyping,
  streamingText,
  onRegenerate,
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const visibleMsgs = messages.length > MAX_VISIBLE_MSGS ? messages.slice(-MAX_VISIBLE_MSGS) : messages;
  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, streamingText, isTyping]);

  return (
    <div className="chat-container">
      <div ref={scrollRef} className="chat-scroll-area">
        {!hasMessages && !isTyping && !isStreaming ? (
          <div className="empty-state">
            <div className="nexus-logo">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="5" fill="white" />
                <circle cx="14" cy="3" r="2.5" fill="white" opacity="0.5" />
                <circle cx="14" cy="25" r="2.5" fill="white" opacity="0.5" />
                <circle cx="3" cy="14" r="2.5" fill="white" opacity="0.5" />
                <circle cx="25" cy="14" r="2.5" fill="white" opacity="0.5" />
              </svg>
            </div>
            <h2>Halo! Saya NexusChat</h2>
            <p>
              Tanya apa saja — sains, kode, kreatif, atau sekadar ngobrol. Dengan dukungan multi-API, Sandbox, Fusion, Debate, dan RP Mode.
            </p>
            <div className="quick-buttons">
              {['Neural Network', 'Kode Python', 'Fakta Sains', 'Ide Bisnis'].map((label) => (
                <button key={label} className="msg-action-btn">
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {visibleMsgs.map((msg, idx) => (
              <div
                key={idx}
                className={`msg-row ${msg.role === 'user' ? 'user' : ''}`}
              >
                <div
                  className={`msg-avatar ${msg.role === 'user' ? 'user' : 'ai'}`}
                >
                  {msg.role === 'user' ? 'U' : 'N'}
                </div>
                <div className="msg-content">
                  <BubbleContent msg={msg} onRegenerate={onRegenerate} />
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="msg-row">
                <div className="msg-avatar ai">N</div>
                <div className="msg-content">
                  <div className="msg-bubble ai">
                    <div className="typing-dots">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isStreaming && streamingText && (
              <div className="msg-row">
                <div className="msg-avatar ai">N</div>
                <div className="msg-content">
                  <div className="msg-bubble ai">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(
                          marked(streamingText, { async: false }) as string,
                          { ADD_ATTR: ['class'] }
                        ),
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
