import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import {
  handleUtterance,
  PHRASES,
  say,
  SPEECH_LOCALE,
  type AssistantState,
} from "@/lib/voiceAssistant";
import type { Language } from "@/i18n/translations";

interface Message {
  from: "bot" | "user";
  text: string;
}

interface SpeechRecognitionResultEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: () => void;
  onend: () => void;
  onerror: () => void;
  onresult: (event: SpeechRecognitionResultEventLike) => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

const LANG_LABEL: Record<Language, string> = { en: "EN", hi: "हिं", te: "తె" };

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [convo, setConvo] = useState<AssistantState>({ place: {} });
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const speak = (text: string) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      const u = new SpeechSynthesisUtterance(text.replace(/[^\p{L}\p{N}\s.,?!:-]/gu, ""));
      u.lang = SPEECH_LOCALE[lang];
      synth.cancel();
      synth.speak(u);
    } catch {
      /* speech synthesis unavailable */
    }
  };

  const push = (m: Message) => setMessages((prev) => [...prev, m]);

  const submit = (text: string) => {
    if (!text.trim()) return;
    push({ from: "user", text });
    const reply = handleUtterance(text, lang, convo);
    setConvo(reply.state);
    push({ from: "bot", text: reply.text });
    speak(reply.text);
    if (reply.navigate) setTimeout(() => navigate(reply.navigate!), 700);
  };

  const startListening = () => {
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SR = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SR) {
      push({ from: "bot", text: say(PHRASES.micUnsupported, lang) });
      return;
    }
    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = SPEECH_LOCALE[lang];
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      push({ from: "bot", text: say(PHRASES.micError, lang) });
    };
    recognition.onresult = (event: SpeechRecognitionResultEventLike) => {
      const text = event.results[0][0].transcript as string;
      submit(text);
    };
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop?.();
    setListening(false);
  };

  const handleOpen = (autoListen = false) => {
    setOpen(true);
    setMessages((prev) =>
      prev.length === 0 ? [{ from: "bot", text: say(PHRASES.greeting, lang) }] : prev
    );
    if (autoListen) setTimeout(startListening, 250);
  };

  // Mic button elsewhere in the app opens this assistant and starts listening
  useEffect(() => {
    const onVoice = () => handleOpen(true);
    window.addEventListener("agrisetu:voice", onVoice as EventListener);
    return () => window.removeEventListener("agrisetu:voice", onVoice as EventListener);
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <>
      {!open && (
        <button
          onClick={() => handleOpen()}
          aria-label="Open AgriSetu assistant"
          className="fixed bottom-20 md:bottom-6 right-4 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 w-80 max-h-[70vh] bg-card border border-border/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-primary text-primary-foreground rounded-t-2xl">
            <span className="font-semibold text-sm">🤖 AgriSetu Assistant</span>
            <div className="flex items-center gap-1">
              {(["en", "hi", "te"] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`text-[11px] px-2 py-0.5 rounded-full transition-colors ${
                    lang === l ? "bg-primary-foreground text-primary font-semibold" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  {LANG_LABEL[l]}
                </button>
              ))}
              <button onClick={() => setOpen(false)} aria-label="Close assistant" className="ml-1">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 max-h-60">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm p-2.5 rounded-xl max-w-[85%] whitespace-pre-line ${
                  m.from === "bot"
                    ? "bg-muted text-foreground"
                    : "bg-primary text-primary-foreground ml-auto"
                }`}
              >
                {m.text}
              </div>
            ))}
            {listening && (
              <div className="text-xs text-muted-foreground animate-pulse">
                🎙️ {say(PHRASES.listening, lang)}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border/50 flex gap-2">
            <Button
              size="sm"
              variant={listening ? "destructive" : "outline"}
              className="rounded-xl h-10 px-3"
              onClick={listening ? stopListening : startListening}
              aria-label="Voice command"
            >
              {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  submit(input);
                  setInput("");
                }
              }}
              placeholder="Type or speak…"
              className="rounded-xl h-10 text-sm"
            />
            <Button
              size="sm"
              className="rounded-xl h-10 px-3"
              onClick={() => {
                submit(input);
                setInput("");
              }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
