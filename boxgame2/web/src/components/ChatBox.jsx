"use client";

import { useEffect, useRef, useState } from "react";

export default function ChatBox({
  myRole,
  wsSend,
  messages,
  setMessages,
  onFocusChange,
}) {
  const [text, setText] = useState("");
  const listRef = useRef(null);

  // auto-scroll al final
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    wsSend({ type: "chat", text: t });
    setText("");
  };

  return (
    <div
      style={{
        width: "min(900px, 95vw)",
        border: "2px solid #e5e7eb",
        borderRadius: 10,
        padding: 12,
        fontFamily: "monospace",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 8 }}>Chat ({myRole})</div>

      <div
        ref={listRef}
        style={{
          height: 160,
          overflowY: "auto",
          border: "1px solid rgba(229,231,235,0.35)",
          borderRadius: 8,
          padding: 8,
          marginBottom: 10,
          background: "rgba(0,0,0,0.25)",
        }}
      >
        {messages.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No hay mensajes.</div>
        ) : (
          messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <span style={{ opacity: 0.75 }}>
                [{new Date(m.ts).toLocaleTimeString()}]{" "}
              </span>
              <b>{m.from}:</b> {m.text}
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="Escribe y Enter..."
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid rgba(229,231,235,0.6)",
            background: "rgba(0,0,0,0.25)",
            color: "#e5e7eb",
            outline: "none",
          }}
        />
        <button
          onClick={send}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid rgba(229,231,235,0.8)",
            background: "rgba(255,255,255,0.08)",
            color: "#e5e7eb",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
