import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Check, ChevronDown, Clipboard, Languages, Mic, MicOff,
  Play, RotateCcw, Sparkles, Square, Volume2, X
} from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "/svc/api").replace(/\/$/, "");

const LANGUAGES = [
  { name: "Roman Urdu", code: "ur-PK" },
  { name: "Urdu", code: "ur-PK" },
  { name: "Saraiki", code: "skr" },
  { name: "Hindi", code: "hi-IN" },
  { name: "Arabic", code: "ar-SA" },
  { name: "Spanish", code: "es-ES" },
  { name: "French", code: "fr-FR" },
  { name: "German", code: "de-DE" },
  { name: "Chinese", code: "zh-CN" },
  { name: "Turkish", code: "tr-TR" },
  { name: "Italian", code: "it-IT" },
  { name: "Portuguese", code: "pt-BR" },
  { name: "Japanese", code: "ja-JP" },
  { name: "Korean", code: "ko-KR" },
  { name: "Russian", code: "ru-RU" }
];

const EXAMPLES = [
  { language: "Roman Urdu", text: "mujhe kal office jana hai lekin mausam bohat kharab hai" },
  { language: "Urdu", text: "مجھے انگریزی میں ایک رسمی ای میل لکھنی ہے۔" },
  { language: "Saraiki", text: "میکوں اج بہت خوشی تھیندی پئی ہے" },
  { language: "Spanish", text: "Necesito terminar este proyecto antes del viernes." },
  { language: "French", text: "Je voudrais réserver une table pour deux personnes." }
];

function recognitionCode(selected) {
  return LANGUAGES.find(x => x.name === selected[0])?.code || "en-US";
}

export default function App() {
  const [selected, setSelected] = useState(["Roman Urdu"]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [text, setText] = useState("");
  const [english, setEnglish] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState("");
  const [copied, setCopied] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const recognitionRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    setVoiceSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    const close = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    const key = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") translate();
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  });

  const toggleLanguage = name => {
    setSelected(current => {
      if (current.includes(name)) {
        const next = current.filter(x => x !== name);
        return next.length ? next : current;
      }
      return [...current, name];
    });
  };

  const startListening = () => {
    setError("");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice input is not supported here. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    recognitionRef.current?.stop();
    const recognition = new SpeechRecognition();
    recognition.lang = recognitionCode(selected);
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setInterim("");
    };

    recognition.onresult = event => {
      let finalText = "";
      let liveText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const value = result[0].transcript;
        if (result.isFinal) finalText += value;
        else liveText += value;
      }
      if (finalText.trim()) {
        setText(current => `${current.trim()}${current.trim() ? " " : ""}${finalText.trim()}`);
      }
      setInterim(liveText);
    };

    recognition.onerror = event => {
      if (event.error === "not-allowed") {
        setError("Microphone permission was blocked. Allow microphone access and try again.");
      } else if (event.error === "no-speech") {
        setError("No speech was detected. Please try speaking again.");
      } else {
        setError(`Voice input error: ${event.error}`);
      }
      setListening(false);
      setInterim("");
    };

    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
    setInterim("");
  };

  const speakEnglish = () => {
    if (!english || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(english);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  async function translate() {
    if (!text.trim()) {
      setError("Please enter text or use the microphone first.");
      return;
    }

    setLoading(true);
    setError("");
    setEnglish("");

    try {
      const response = await fetch(`${API_URL}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), languages: selected })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Translation failed.");
      setEnglish(data.english || "");
    } catch (err) {
      setError(err.message || "Could not connect to the FastAPI server.");
    } finally {
      setLoading(false);
    }
  }

  const copy = async () => {
    if (!english) return;
    try {
      await navigator.clipboard.writeText(english);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Could not copy the translation.");
    }
  };

  const clear = () => {
    stopListening();
    stopSpeaking();
    setText("");
    setEnglish("");
    setError("");
    setInterim("");
    setCopied(false);
  };

  const useExample = example => {
    setSelected([example.language]);
    setText(example.text);
    setEnglish("");
    setError("");
  };

  const languageLabel = selected.length === 1 ? selected[0] : `${selected.length} languages`;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Languages size={20} /></div>
          <div>
            <div className="brand-name">LinguaAI</div>
            <div className="brand-subtitle">Multilingual Translator</div>
          </div>
        </div>
        <div className="topbar-badge"><Sparkles size={14} /> AI Powered</div>
      </header>

      <main className="page">
        <section className="hero">
          <div className="eyebrow"><span className="eyebrow-dot" /> SPEAK · TYPE · TRANSLATE</div>
          <h1>Turn your words into <span>natural English.</span></h1>
          <p>Type or speak in your language and get a clear, fluent English translation while preserving your meaning and tone.</p>
        </section>

        <section className="workspace">
          <div className="language-row">
            <div className="language-selector" ref={menuRef}>
              <button className="language-trigger" onClick={() => setMenuOpen(x => !x)}>
                <Languages size={17} /><span>Input language</span><strong>{languageLabel}</strong>
                <ChevronDown size={17} className={menuOpen ? "rotate" : ""} />
              </button>

              {menuOpen && (
                <div className="language-menu">
                  <div className="menu-title"><span>Possible input languages</span><span className="menu-count">{selected.length}</span></div>
                  <div className="language-list">
                    {LANGUAGES.map(language => {
                      const checked = selected.includes(language.name);
                      return (
                        <button className="language-option" key={language.name} onClick={() => toggleLanguage(language.name)}>
                          <span className={`checkbox ${checked ? "checked" : ""}`}>{checked && <Check size={13} />}</span>
                          <span>{language.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="voice-hint"><Mic size={14} /> Voice input uses the first selected language.</div>
                </div>
              )}
            </div>

            <div className="output-language">
              <span>Output</span><strong>English</strong><span className="fixed-pill">Fixed</span>
            </div>
          </div>

          <div className="translation-grid">
            <section className="panel">
              <div className="panel-head">
                <div><span className="panel-kicker">INPUT</span><h2>Your text</h2></div>
                <span className="language-chip">{languageLabel}</span>
              </div>

              <div className={`textarea-wrap ${listening ? "recording" : ""}`}>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Type your text here, or use the microphone to speak..."
                  maxLength={10000}
                  disabled={loading}
                />
                {interim && <div className="interim-text">{interim}</div>}
                <div className="input-tools">
                  <span>{text.length.toLocaleString()} / 10,000</span>
                  <div className="input-actions">
                    {listening ? (
                      <button className="voice-button listening" onClick={stopListening}><Square size={15} fill="currentColor" /> Stop</button>
                    ) : (
                      <button className="voice-button" onClick={startListening} disabled={!voiceSupported}>
                        <Mic size={17} /> Speak
                      </button>
                    )}
                    {text && <button className="icon-button" onClick={() => setText("")}><X size={17} /></button>}
                  </div>
                </div>
              </div>

              {!voiceSupported && (
                <div className="support-note"><MicOff size={14} /> Voice input is unavailable in this browser. Chrome or Edge is recommended.</div>
              )}
              {listening && (
                <div className="recording-note"><span className="pulse-dot" /> Listening in {recognitionCode(selected)}... Speak naturally, then press Stop.</div>
              )}
            </section>

            <div className="translate-column">
              <div className="arrow-circle"><ArrowRight size={20} /></div>
              <button className="translate-button" onClick={translate} disabled={loading || !text.trim()}>
                {loading ? <><span className="spinner" /> Translating...</> : <>Translate <ArrowRight size={17} /></>}
              </button>
              <span className="shortcut">CTRL + ENTER</span>
            </div>

            <section className="panel">
              <div className="panel-head">
                <div><span className="panel-kicker">OUTPUT</span><h2>English</h2></div>
                {english && (
                  <div className="output-actions">
                    {speaking ? (
                      <button className="tool-button active" onClick={stopSpeaking}><Square size={15} fill="currentColor" /> Stop</button>
                    ) : (
                      <button className="tool-button" onClick={speakEnglish}><Volume2 size={16} /> Listen</button>
                    )}
                    <button className="tool-button" onClick={copy}>{copied ? <Check size={16} /> : <Clipboard size={16} />}{copied ? "Copied" : "Copy"}</button>
                  </div>
                )}
              </div>

              <div className="output-body">
                {loading ? (
                  <div className="loading-state">
                    <div className="loading-orb"><Sparkles size={21} /></div>
                    <strong>Understanding your message...</strong>
                    <span>Creating a natural English translation</span>
                  </div>
                ) : english ? (
                  <p className="translation-text">{english}</p>
                ) : (
                  <div className="empty-output">
                    <div className="empty-icon"><Languages size={22} /></div>
                    <strong>Your English translation will appear here</strong>
                    <span>Enter text or speak, then click Translate.</span>
                  </div>
                )}
              </div>
            </section>
          </div>

          {error && (
            <div className="error-banner">
              <X size={17} /><span>{error}</span><button onClick={() => setError("")}>Dismiss</button>
            </div>
          )}

          <div className="bottom-actions">
            <button className="clear-button" onClick={clear}><RotateCcw size={15} /> Clear workspace</button>
            <span className="privacy-note">Your text is processed only when you click Translate.</span>
          </div>
        </section>

        <section className="examples">
          <div className="examples-head">
            <div><span className="panel-kicker">TRY IT</span><h2>Quick examples</h2></div>
            <span>Type or speak any supported language</span>
          </div>
          <div className="example-grid">
            {EXAMPLES.map(example => (
              <button className="example-card" key={example.language} onClick={() => useExample(example)}>
                <div className="example-top"><span>{example.language}</span><Play size={14} /></div>
                <p>{example.text}</p>
              </button>
            ))}
          </div>
        </section>

        <footer className="footer">
          <span>LinguaAI</span><span>Multilingual input → English output</span><span>Powered by Azure AI</span>
        </footer>
      </main>
    </div>
  );
}
