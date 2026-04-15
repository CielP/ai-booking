import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const TAB_LABELS = {
  available: '查詢空房',
  book: '預訂房間',
  mybookings: '我的訂單',
  admin: '管理後台',
};

export default function ChatWidget({ activeTab, bookPrefill }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '您好！我是小山，山景旅宿的 AI 客服助理。有什麼可以幫您的嗎？' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  function getContext() {
    return {
      userName: user?.name || '訪客',
      currentPage: TAB_LABELS[activeTab] || activeTab,
      prefillDate: bookPrefill
        ? `${bookPrefill.checkIn} ~ ${bookPrefill.checkOut}`
        : '未選擇',
    };
  }

  function getHistory() {
    // Send last 10 messages as history (excluding the welcome message index 0)
    return messages.slice(1).map((m) => ({ role: m.role, content: m.content }));
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    // Add placeholder for assistant response
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: text,
          history: getHistory(),
          context: getContext(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '發送失敗');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6);
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === 'text') {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === 'assistant') {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + event.content,
                  };
                }
                return updated;
              });
            } else if (event.type === 'error') {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: event.content || 'AI 回覆時發生錯誤，請稍後再試。',
                };
                return updated;
              });
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        // Replace the empty placeholder or update last assistant message
        if (updated[updated.length - 1]?.role === 'assistant' && !updated[updated.length - 1].content) {
          updated[updated.length - 1] = {
            role: 'assistant',
            content: err.message || '發送失敗，請稍後再試。',
          };
        } else {
          updated.push({ role: 'assistant', content: err.message || '發送失敗，請稍後再試。' });
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        className="chat-fab"
        onClick={() => setOpen(!open)}
        title="AI 客服"
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat window */}
      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <span>🏔️ 小山 AI 客服</span>
            <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble chat-bubble-${m.role}`}>
                {m.content || (loading && i === messages.length - 1 ? '思考中…' : '')}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form className="chat-input-form" onSubmit={handleSend}>
            <input
              ref={inputRef}
              className="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="輸入訊息…"
              disabled={loading}
            />
            <button className="chat-send-btn" type="submit" disabled={loading || !input.trim()}>
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
