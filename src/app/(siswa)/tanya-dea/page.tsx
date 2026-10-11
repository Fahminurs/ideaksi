"use client";

// Tanya Dea sebagai halaman: obrolan di kiri, riwayat di kanan (HP: riwayat lewat tombol).
import { useEffect, useRef, useState } from "react";
import { Bot, History, MapPin, Pin, Send, SquarePen } from "lucide-react";
import { useLatestArticle } from "@/lib/articles";
import { STAGES } from "@/lib/stages";
import { mockReply, saveChat, useChats, type ChatMsg, type ChatSession } from "@/lib/chat";
import { apiEnabled, call } from "@/lib/api";
import styles from "./tanya-dea.module.css";

const GREETING: ChatMsg = { from: "bot", text: "Halo, aku Dea! Ada yang bisa kubantu tentang artikelmu?" };
const SUGGESTIONS = ["Judul saya sudah bagus belum?", "Cara menulis pendahuluan", "Cara menyebut sumber"];

const newSessionId = () => Date.now().toString(36);
const formatTime = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function HistoryList({
  chats, activeId, onPick, onNew,
}: { chats: ChatSession[]; activeId: string | null; onPick: (c: ChatSession) => void; onNew: () => void }) {
  return (
    <>
      <button type="button" className={styles.newChatBtn} onClick={onNew}>
        <SquarePen size={18} aria-hidden /> Obrolan baru
      </button>
      {chats.length === 0 ? (
        <p className={styles.historyEmpty}>Belum ada obrolan. Pertanyaanmu nanti tersimpan di sini.</p>
      ) : (
        <ul className={styles.historyList}>
          {chats.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => onPick(c)} aria-current={c.id === activeId ? "true" : undefined}>
                <strong>{c.title}</strong>
                <small>
                  {formatTime(c.updated)}, {c.messages.filter((m) => m.from === "me").length} pertanyaan
                </small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function TanyaAiPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([GREETING]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const chats = useChats();
  const [historyOpen, setHistoryOpen] = useState(false); // panel riwayat di HP
  const article = useLatestArticle();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Simpan obrolan setiap ada pesan baru (mulai dari pertanyaan pertama).
  useEffect(() => {
    const first = messages.find((m) => m.from === "me");
    if (sessionId && first) {
      saveChat({ id: sessionId, title: first.text, updated: new Date().toISOString(), messages });
    }
  }, [messages, sessionId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  const send = (value: string) => {
    const q = value.trim();
    if (!q || typing) return;
    const sid = sessionId ?? newSessionId();
    if (!sessionId) setSessionId(sid);
    setMessages((m) => [...m, { from: "me", text: q }]);
    setText("");
    setTyping(true);
    const reply = (t: string) => {
      setMessages((m) => [...m, { from: "bot", text: t }]);
      setTyping(false);
    };

    if (!apiEnabled) {
      // mode lokal: jawaban berbasis kata kunci
      setTimeout(() => reply(mockReply(q)), 700);
      return;
    }
    // Dea (Gemini) lewat backend; server hanya membawa beberapa pesan terakhir obrolan ini sebagai memori
    const context = {
      stage: article ? STAGES[article.stage - 1].label : undefined,
      topic: article?.topic?.text,
      question: article?.question?.main,
    };
    call<{ reply: string }>("chat.send", { sessionId: sid, message: q, context })
      .then((d) => reply(d.reply))
      .catch((e) => reply(e instanceof Error ? e.message : "Dea sedang sibuk. Coba lagi sebentar lagi, ya."));
  };

  const newChat = () => {
    setMessages([GREETING]);
    setSessionId(null);
    setText("");
    setTyping(false);
    setHistoryOpen(false);
    inputRef.current?.focus();
  };

  const openSession = (c: ChatSession) => {
    setMessages(c.messages);
    setSessionId(c.id);
    setHistoryOpen(false);
  };

  const stage = article && STAGES[article.stage - 1];

  return (
    <div className={styles.layout}>
      <section className={styles.chat} aria-label="Obrolan Tanya Dea">
        <div className={styles.headBar}>
        <header className={styles.head}>
          <span className={styles.botAvatar} aria-hidden><Bot size={22} /></span>
          <div className={styles.headText}>
            <h1>Tanya Dea</h1>
            <p>Teman menulismu di Ideaksi</p>
          </div>
          <button
            type="button"
            className={styles.historyToggle}
            onClick={() => setHistoryOpen((o) => !o)}
            aria-expanded={historyOpen}
            aria-controls="history-mobile"
          >
            <History size={18} aria-hidden /> Riwayat
          </button>
        </header>

        {historyOpen && (
          <div id="history-mobile" className={styles.historyPanel}>
            <HistoryList chats={chats} activeId={sessionId} onPick={openSession} onNew={newChat} />
          </div>
        )}
        </div>

        <div className={styles.messages} aria-live="polite">
          {messages.map((m, i) => (
            <p key={i} className={m.from === "me" ? styles.me : styles.bot}>{m.text}</p>
          ))}
          {typing && (
            <p className={`${styles.bot} ${styles.typing}`} aria-label="Asisten sedang mengetik">
              <span /><span /><span />
            </p>
          )}
          {messages.length === 1 && (
            <div className={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className={styles.composer}>
          {article?.topic && (
            <div className={styles.context}>
              <p><Pin size={14} aria-hidden /> Topikmu: <strong>{article.topic.text}</strong></p>
              {stage && <p><MapPin size={14} aria-hidden /> Tahap: <strong>{article.stage} - {stage.label}</strong></p>}
            </div>
          )}
          <form className={styles.inputRow} onSubmit={(e) => { e.preventDefault(); send(text); }}>
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ketik pertanyaanmu..."
              aria-label="Pesan untuk asisten"
            />
            <button type="submit" className={styles.sendBtn} aria-label="Kirim" disabled={!text.trim() || typing}>
              <Send size={18} aria-hidden />
            </button>
          </form>
        </div>
      </section>

      <aside className={styles.historyAside} aria-label="Riwayat obrolan">
        <p className={styles.asideTitle}>Riwayat obrolan</p>
        <HistoryList chats={chats} activeId={sessionId} onPick={openSession} onNew={newChat} />
      </aside>
    </div>
  );
}
