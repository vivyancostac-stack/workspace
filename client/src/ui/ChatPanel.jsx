import React, { useEffect, useRef, useState } from "react";

export function ChatPanel({ npc, playerName, onFocusChange }) {
  const [messagesByNpc, setMessagesByNpc] = useState({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  const messages = npc ? messagesByNpc[npc.id] || [] : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, npc?.id]);

  async function send() {
    const text = input.trim();
    if (!text || !npc || loading) return;
    setInput("");

    const history = (messagesByNpc[npc.id] || []).map((m) => ({ role: m.role, content: m.content }));
    const userMsg = { role: "user", content: text };
    setMessagesByNpc((prev) => ({
      ...prev,
      [npc.id]: [...(prev[npc.id] || []), userMsg, { role: "assistant", content: "…", pending: true }]
    }));
    setLoading(true);

    try {
      const res = await fetch("/api/npc/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          npcId: npc.id,
          history,
          message: text,
          system: npc.system || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setMessagesByNpc((prev) => {
        const list = [...(prev[npc.id] || [])];
        // replace pending
        for (let i = list.length - 1; i >= 0; i--) {
          if (list[i].pending) {
            list[i] = { role: "assistant", content: data.reply };
            break;
          }
        }
        return { ...prev, [npc.id]: list };
      });
    } catch (err) {
      setMessagesByNpc((prev) => {
        const list = [...(prev[npc.id] || [])];
        for (let i = list.length - 1; i >= 0; i--) {
          if (list[i].pending) {
            list[i] = { role: "error", content: `Erro: ${err.message}` };
            break;
          }
        }
        return { ...prev, [npc.id]: list };
      });
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    } else if (e.key === "Escape") {
      inputRef.current?.blur();
    }
  }

  if (!npc) {
    return (
      <aside className="chat-panel">
        <div className="chat-empty">
          Chegue perto de um funcionário e pressione <kbd>E</kbd> para conversar.
          <br /><br />
          Mova-se com <kbd>WASD</kbd> ou <kbd>setas</kbd>.
        </div>
      </aside>
    );
  }

  const colorHex = npc.color || "#888";

  return (
    <aside className="chat-panel">
      <header className="chat-header">
        <div className="avatar" style={{ background: colorHex }}>
          {npc.name[0]}
        </div>
        <div className="meta">
          <span className="name">{npc.name}</span>
          <span className="role">{npc.role}</span>
        </div>
      </header>

      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="msg assistant">Oi! Pode me chamar. 👋</div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`msg ${m.role} ${m.pending ? "thinking" : ""}`}
          >
            {m.content}
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
          placeholder={`Escreva para ${npc.name}…`}
          disabled={loading}
        />
        <button onClick={send} disabled={loading || !input.trim()}>
          Enviar
        </button>
      </div>
    </aside>
  );
}
