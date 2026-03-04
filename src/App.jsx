import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import Avatar from './components/Avatar';
import './App.css';
import { askClaude } from './lib/claude';
import { speakText } from './hooks/useElevenLabs';
import BackgroundParticles from './components/BackgroundParticles';
import AudioVisualizer from './components/AudioVisualizer';
import AvatarParticles from './components/AvatarParticles';
import SplashScreen from './components/SplashScreen';
import { Download, FileDown, Github, Globe, Linkedin } from 'lucide-react';
import jsPDF from 'jspdf';
import { unlockAudio } from './lib/unlockAudio';

function ThinkingIndicator() {
  return (
    <div className="thinking" aria-label="Assistant is thinking">
      <span />
      <span />
      <span />
    </div>
  );
}

function PaperPlaneIcon({ className = '' }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M21 3 9.5 14.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 3 14.2 21l-4.7-6.5L3 9.8 21 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function App() {
  const [title, setTitle] = useState('');
  const [draft, setDraft] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [visitorCount, setVisitorCount] = useState(null);
  const MAX_PROMPTS = 20;
  const [promptCount, setPromptCount] = useState(() => {
    try {
      const lastReset = localStorage.getItem('promptCountReset');
      const now = Date.now();
      if (!lastReset || now - parseInt(lastReset, 10) > 86400000) {
        localStorage.setItem('promptCount', '0');
        localStorage.setItem('promptCountReset', now.toString());
        return 0;
      }
      const stored = parseInt(localStorage.getItem('promptCount') || '0', 10);
      return Number.isFinite(stored) ? stored : 0;
    } catch (e) {
      return 0;
    }
  });
  const recognitionRef = useRef(null);
  const liveTranscriptRef = useRef('');
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [micBanner, setMicBanner] = useState('');
  const [showVoiceTooltip, setShowVoiceTooltip] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(() => {
    try {
      return sessionStorage.getItem('hasInitialized') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return sessionStorage.getItem('hasInitialized') !== 'true';
    } catch (e) {
      return true;
    }
  });
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [messages, setMessages] = useState(() => [
    {
      id: crypto?.randomUUID?.() ?? String(Date.now()),
      role: 'welcome',
      content:
        "Hey! 👋 I'm Priyank's AI agent. Ask me about his projects, experience, skills, or anything else you'd like to know.",
    },
  ]);

  const suggestions = useMemo(
    () => [
      'Tell me about StemAlly',
      "What's your tech stack?",
      'Where do you see yourself in 5 years?',
    ],
    []
  );

  const isPromptLimitReached = promptCount >= MAX_PROMPTS;
  const promptsRemaining = Math.max(0, MAX_PROMPTS - promptCount);

  const canSend = useMemo(
    () => !isThinking && !isPromptLimitReached && draft.trim().length > 0,
    [draft, isThinking, isPromptLimitReached]
  );

  const chatRef = useRef(null);
  const messageRef = useRef(null);
  const [lastAssistantId, setLastAssistantId] = useState(null);

  useEffect(() => {
    const full = 'priyank.exe';
    let i = 0;
    let timeoutId;

    const tick = () => {
      i += 1;
      setTitle(full.slice(0, i));
      if (i < full.length) timeoutId = window.setTimeout(tick, 90);
    };

    timeoutId = window.setTimeout(tick, 240);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      (typeof window.webkitSpeechRecognition !== 'undefined' ||
        typeof window.SpeechRecognition !== 'undefined');
    setIsVoiceSupported(!!supported);
  }, []);

  useEffect(() => {
    try {
      const lastReset = localStorage.getItem('promptCountReset');
      const now = Date.now();
      if (!lastReset || now - parseInt(lastReset, 10) > 86400000) {
        localStorage.setItem('promptCount', '0');
        localStorage.setItem('promptCountReset', now.toString());
        setPromptCount(0);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    const unlock = () => {
      unlockAudio();

      // Remove listeners after first interaction
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('touchend', unlock);
      document.removeEventListener('click', unlock);
    };

    document.addEventListener('touchstart', unlock);
    document.addEventListener('touchend', unlock);
    document.addEventListener('click', unlock);

    return () => {
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('touchend', unlock);
      document.removeEventListener('click', unlock);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const proxyUrl = process.env.REACT_APP_PROXY_URL || 'http://localhost:3001';

    fetch(`${proxyUrl}/api/visitors`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const n = typeof j?.count === 'number' ? j.count : 0;
        setVisitorCount(n);
      })
      .catch(() => {
        if (cancelled) return;
        setVisitorCount(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const subtitles = useMemo(
    () => [
      'Software Engineer · MS Northeastern',
      'Building accessible experiences',
      'Boston · Available July 2026',
      'iOS · Full-stack · Cloud',
    ],
    []
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setSubtitleIndex((i) => (i + 1) % subtitles.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, [subtitles.length]);

  const avatarState =
    isSpeaking || isThinking ? 'talking' : isVoiceListening ? 'listening' : 'idle';

  const visibleMessages = useMemo(
    () => messages.filter((m) => m.role === 'welcome' || m.role === 'user' || m.role === 'assistant'),
    [messages]
  );

  useEffect(() => {
    if (!lastAssistantId) return;
    const id = window.setTimeout(() => {
      messageRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 300);
    return () => window.clearTimeout(id);
  }, [lastAssistantId]);

  const exportChat = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Conversation with priyank.exe', 20, 20);
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString(), 20, 30);
    let y = 45;
    visibleMessages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .forEach((msg) => {
        const prefix = msg.role === 'user' ? 'Recruiter: ' : 'Priyank: ';
        const lines = doc.splitTextToSize(prefix + msg.content, 170);
        doc.text(lines, 20, y);
        y += lines.length * 7 + 5;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
    doc.save('priyank-conversation.pdf');
  };

  const trackConversation = async (question, response) => {
    try {
      const proxyUrl = process.env.REACT_APP_PROXY_URL || 'http://localhost:3001';
      let sessionId = sessionStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(7);
        sessionStorage.setItem('sessionId', sessionId);
      }
      await fetch(`${proxyUrl}/api/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          response,
          userAgent: navigator.userAgent,
          sessionId,
        }),
      });
    } catch (err) {
      // fail silently, don't break the app
    }
  };

  async function handleInitialize() {
    try {
      sessionStorage.setItem('hasInitialized', 'true');
    } catch (e) {
      // ignore
    }

    // Let splash animate out; main app fades in via CSS class
    setHasInitialized(true);
    window.setTimeout(() => setShowSplash(false), 600);

    const greeting = "Hey — I'm Priyank. Ask me anything.";
    const audio = await speakText(greeting);
    if (audio && !audio.error) {
      setCurrentAudio(audio);
      setIsSpeaking(true);
      const prev = audio.onended;
      audio.onended = (...args) => {
        try {
          if (typeof prev === 'function') prev(...args);
        } finally {
          setIsSpeaking(false);
          setCurrentAudio(null);
        }
      };
    }
  }

  const stopSpeaking = () => {
    try {
      if (currentAudio) {
        if (typeof currentAudio.pause === 'function') {
          currentAudio.pause();
          try {
            currentAudio.currentTime = 0;
          } catch (e) {
            // ignore
          }
        } else if (typeof currentAudio.stop === 'function') {
          currentAudio.stop();
        }
      }
    } catch (e) {
      // ignore
    } finally {
      setCurrentAudio(null);
      setIsSpeaking(false);
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch (e) {
      // ignore
    }
    recognitionRef.current = null;
    liveTranscriptRef.current = '';
    setIsVoiceListening(false);
    setLiveTranscript('');
  };

  const startListening = () => {
    if (isPromptLimitReached) return;
    if (currentAudio) stopSpeaking();

    setMicBanner('');
    if (!isVoiceSupported) {
      setShowVoiceTooltip(true);
      window.setTimeout(() => setShowVoiceTooltip(false), 2400);
      return;
    }

    if (isVoiceListening) {
      stopListening();
      return;
    }

    const Ctor = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!Ctor) {
      setIsVoiceSupported(false);
      setShowVoiceTooltip(true);
      window.setTimeout(() => setShowVoiceTooltip(false), 2400);
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    let finalText = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const res = event.results[i];
        const text = res?.[0]?.transcript ?? '';
        if (res.isFinal) finalText += text;
        else interim += text;
      }
      const merged = `${finalText} ${interim}`.replace(/\s+/g, ' ').trim();
      liveTranscriptRef.current = merged;
      setLiveTranscript(merged);
    };

    recognition.onerror = (event) => {
      const err = event?.error;
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        setMicBanner('Mic access needed for voice mode');
      }
      stopListening();
    };

    recognition.onend = () => {
      const text = (finalText || liveTranscriptRef.current).replace(/\s+/g, ' ').trim();
      stopListening();
      if (text) sendMessage(text);
    };

    try {
      setIsVoiceListening(true);
      liveTranscriptRef.current = '';
      setLiveTranscript('');
      recognition.start();
    } catch (e) {
      stopListening();
    }
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key?.toLowerCase?.() !== 's') return;
      const tag = e.target?.tagName?.toLowerCase?.();
      if (tag === 'textarea' || tag === 'input') return;
      if (isPromptLimitReached) return;
      e.preventDefault();
      startListening();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVoiceSupported, isVoiceListening, isPromptLimitReached]);

  const showPromptLimitMessage = () => {
    const id = crypto?.randomUUID?.() ?? String(Date.now() + Math.random());
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.kind === 'limit') return prev;
      return [
        ...prev,
        {
          id,
          role: 'assistant',
          kind: 'limit',
          content:
            "You've reached the 20 message limit for this session. To continue the conversation, reach out to Priyank directly at bagad.pr@northeastern.edu or connect on LinkedIn!",
        },
      ];
    });
    setLastAssistantId(id);
  };

  async function sendMessage(overrideText) {
    const text = (overrideText ?? draft).trim();
    if (!text || isThinking) return;

    if (isPromptLimitReached) {
      showPromptLimitMessage();
      return;
    }

    const newCount = promptCount + 1;
    setPromptCount(newCount);
    try {
      localStorage.setItem('promptCount', newCount.toString());
      if (!localStorage.getItem('promptCountReset')) {
        localStorage.setItem('promptCountReset', Date.now().toString());
      }
    } catch (e) {
      // ignore
    }

    const userMsg = {
      id: crypto?.randomUUID?.() ?? String(Date.now() + Math.random()),
      role: 'user',
      content: text,
    };

    setDraft('');
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsThinking(true);

    let assistantText = '';
    let claudeOk = false;

    try {
      const conversation = nextMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));

      const replyText = await askClaude(conversation);
      assistantText = replyText || "Sorry, I'm having trouble connecting right now.";
      claudeOk = true;
    } catch (e) {
      assistantText = "Sorry, I'm having trouble connecting right now.";
    } finally {
      setIsThinking(false);
    }

    const assistantMsg = {
      id: crypto?.randomUUID?.() ?? String(Date.now() + Math.random()),
      role: 'assistant',
      content: assistantText,
    };

    // Update UI immediately
    setMessages((m) => [...m, assistantMsg]);
    setLastAssistantId(assistantMsg.id);

    // Fire-and-forget side effects (run in parallel with UI update)
    if (claudeOk) {
      trackConversation(text, assistantText);
    }

    speakText(assistantText)
      .then((audio) => {
        if (!audio || audio.error) return;
        setCurrentAudio(audio);
        setIsSpeaking(true);
        const prev = audio.onended;
        audio.onended = (...args) => {
          try {
            if (typeof prev === 'function') prev(...args);
          } finally {
            setIsSpeaking(false);
            setCurrentAudio(null);
          }
        };
      })
      .catch(() => {
        // ignore
      });
  }

  function onInputKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="app" data-avatar-state={avatarState}>
      <BackgroundParticles count={40} />

      {showSplash ? <SplashScreen onInitialize={handleInitialize} /> : null}

      <div className={`mainApp ${hasInitialized ? 'show' : 'hide'}`}>
      <header className="topHeader" aria-label="Header">
        <div className="nameRow">
          <div className="name">
            {title}
            <span className="cursor" aria-hidden="true">
              |
            </span>
          </div>
          <span className="statusDot" aria-label={`Status: ${avatarState}`} />
        </div>
        <div className="subtitle">{subtitles[subtitleIndex]}</div>

        <div className="social" aria-label="Social links">
          <a
            className="socialBtn"
            href="https://www.priyankbagad.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Website"
          >
            <Globe size={18} />
          </a>
          <a
            className="socialBtn"
            href="https://www.linkedin.com/in/priyankbagad/"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
          >
            <Linkedin size={18} />
          </a>
          <a
            className="socialBtn"
            href="https://github.com/priyankbagad"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
          >
            <Github size={18} />
          </a>
          <a
            className="socialBtn"
            href="/resume.pdf"
            target="_blank"
            rel="noreferrer"
            aria-label="Download resume"
          >
            <Download size={18} />
          </a>
        </div>
      </header>

      <main className="stage" aria-label="Main">
        <div className="avatarArea" aria-label="Avatar area">
          <div className="avatarHalo" aria-hidden="true" />
          <div className="avatarWrap" aria-hidden="false">
            <AvatarParticles count={20} />
            <Avatar state={avatarState} />
          </div>
        </div>

        {typeof visitorCount === 'number' ? (
          <motion.div
            className="visitorBadge"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut', delay: 0.35 }}
          >
            You're visitor #{visitorCount + 1}
          </motion.div>
        ) : null}

        <div className="voiceArea" aria-label="Voice controls">
          {micBanner ? <div className="micBanner">{micBanner}</div> : null}

          {isSpeaking && currentAudio ? (
            <motion.button
              type="button"
              className="stopBtn"
              onClick={stopSpeaking}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              aria-label="Stop speaking"
            >
              ◼ STOP
            </motion.button>
          ) : null}

          {isVoiceListening || liveTranscript ? (
            <div className="liveTranscript">
              &gt; {liveTranscript || 'I can hear you...'}
            </div>
          ) : null}

          <div className="speakBtnRow">
            <button
              type="button"
              className={`speakBtn ${isVoiceListening ? 'listening' : ''}`}
              onClick={startListening}
              disabled={isPromptLimitReached}
              onMouseEnter={() => {
                if (!isVoiceSupported) setShowVoiceTooltip(true);
              }}
              onMouseLeave={() => setShowVoiceTooltip(false)}
              aria-pressed={isVoiceListening}
              aria-label={isVoiceListening ? 'Stop listening' : 'Speak with me'}
            >
              <span className={`dot ${isVoiceListening ? 'red' : ''}`} aria-hidden="true" />
              <span className="speakText">
                {isVoiceListening ? 'LISTENING...' : 'SPEAK WITH ME'}
              </span>
            </button>

            {showVoiceTooltip && !isVoiceSupported ? (
              <div className="voiceTooltip" role="status">
                Voice not supported in this browser. Try Chrome or Safari.
              </div>
            ) : null}
          </div>

          <div className="speakHint">press S to speak</div>
        </div>

        <div className="chatStream" ref={chatRef} aria-label="Chat">
          <AnimatePresence initial={false}>
            {visibleMessages.map((m) => {
              if (m.role === 'user') {
                return (
                  <motion.div
                    key={m.id}
                    className="msgUser"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                  >
                    &gt; {m.content}
                  </motion.div>
                );
              }

              // welcome + assistant
              return (
                <motion.div
                  key={m.id}
                  className="msgAI"
                  ref={m.role === 'assistant' && m.id === lastAssistantId ? messageRef : undefined}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  {m.content}
                  {m.kind === 'limit' ? (
                    <div className="limitActions">
                      <a className="limitBtn" href="mailto:bagad.pr@northeastern.edu">
                        ✉️ Email Priyank
                      </a>
                      <a
                        className="limitBtn"
                        href="https://linkedin.com/in/priyankbagad"
                        target="_blank"
                        rel="noreferrer"
                      >
                        💼 LinkedIn
                      </a>
                    </div>
                  ) : null}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {isThinking ? (
            <motion.div
              className="msgAI"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <ThinkingIndicator />
            </motion.div>
          ) : null}
        </div>

        <div className="chips chipsCentered" aria-label="Suggestions">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="chip"
              onClick={() => sendMessage(s)}
              disabled={isThinking || isPromptLimitReached}
            >
              {s}
            </button>
          ))}
        </div>
      </main>

      <button
        type="button"
        className="exportBtn"
        onClick={exportChat}
        aria-label="Export chat"
        title="Export chat"
      >
        <FileDown size={18} />
      </button>

      <div className="bottomDock" role="group" aria-label="Input">
        <div className="bottomBar bottomBarCentered">
          {promptsRemaining <= 5 && promptsRemaining > 0 ? (
            <div className="promptCounter">{promptsRemaining} questions remaining</div>
          ) : null}
          <div className="inputWrap">
            <textarea
              className="textInput"
              value={draft}
              onChange={(e) => {
                if (currentAudio) stopSpeaking();
                setDraft(e.target.value);
              }}
              onFocus={() => {
                if (currentAudio) stopSpeaking();
              }}
              onKeyDown={onInputKeyDown}
              placeholder="or type here..."
              rows={1}
              disabled={isThinking}
            />
            <button
              type="button"
              className="sendBtn"
              onClick={() => sendMessage()}
              disabled={!canSend || isPromptLimitReached}
              aria-label="Send message"
            >
              <PaperPlaneIcon className="sendIcon" />
            </button>
          </div>
        </div>
      </div>
      <AudioVisualizer audio={currentAudio} bars={40} />
      </div>
    </div>
  );
}
