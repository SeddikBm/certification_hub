import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatService, type ChatMessage, type ChatTraceItem, type SourceInfo } from '../services/chat.service';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Trash2, 
  ExternalLink, 
  Layers, 
  Database, 
  Globe, 
  CheckCircle2, 
  Clock, 
  MessageSquare,
  ChevronDown,
  ArrowRight
} from 'lucide-react';

interface FormattedMessageProps {
  content: string | null | undefined;
}

// Simple lightweight markdown parser for bold, headers, lists, code, and links
function MarkdownView({ content }: FormattedMessageProps) {
  const formatText = (text: string) => {
    // Process lines
    const lines = (text || '').split('\n');
    return lines.map((line, idx) => {
      // Heading
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-sm font-bold text-gray-900 mt-2 mb-1">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="text-base font-bold text-gray-900 mt-2.5 mb-1">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={idx} className="text-lg font-extrabold text-gray-900 mt-3 mb-1.5">{line.replace('# ', '')}</h2>;
      }
      // Bullet list
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const itemText = line.trim().substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-xs sm:text-sm text-gray-700 my-0.5 leading-relaxed">
            {renderInlineMarkdown(itemText)}
          </li>
        );
      }
      // Numbered list
      const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-1 text-xs sm:text-sm text-gray-700 my-0.5 leading-relaxed">
            <span className="font-bold text-[#b70f30] text-xs">{numMatch[1]}.</span>
            <span>{renderInlineMarkdown(numMatch[2])}</span>
          </div>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      // Normal paragraph
      return (
        <p key={idx} className="text-xs sm:text-sm text-gray-800 my-0.5 leading-relaxed">
          {renderInlineMarkdown(line)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (text: string) => {
    // Bold: **text**
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-red-50 text-[#b70f30] px-1.5 py-0.5 rounded text-xs font-mono font-medium border border-red-100">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return <div className="space-y-0.5">{formatText(content || '')}</div>;
}

function ResearchTrace({ trace }: { trace: ChatTraceItem[] }) {
  if (!trace.length) return null;
  return (
    <div className="mb-2 ml-1 max-w-[90%] space-y-1.5">
      {trace.map((item, index) => {
        const type = (item.type || '').toLowerCase();
        const isSql = type === 'sql';
        return (
          <div key={`${item.label || 'trace'}-${index}`} className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2 text-xs text-slate-700">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-800">
              {isSql ? <Database className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />}
              <span>{item.label || 'Recherche effectuée'}</span>
              {item.status && <span className="ml-auto text-[10px] font-medium text-indigo-500">{item.status}</span>}
            </div>
            {isSql ? (
              <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-950 px-2 py-1.5 font-mono text-[10px] text-slate-100">{item.detail || 'Requête indisponible'}</pre>
            ) : (
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{item.detail || 'Recherche terminée.'}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

const STARTER_FAQS = [
  {
    icon: 'verified',
    title: 'Format PSM I',
    query: "Quel est le format de l'examen PSM I ?",
  },
  {
    icon: 'groups',
    title: 'Priorités Squad',
    query: "Quelles sont les certifications prioritaires pour ma squad ?",
  },
  {
    icon: 'school',
    title: 'Débuter en Cloud',
    query: "Quelles certifications me conseilles-tu pour débuter dans le Cloud ?",
  },
  {
    icon: 'payments',
    title: 'Prix & Budget',
    query: "Combien coûte la certification Microsoft AZ-204 en MAD et USD ?",
  },
];

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Array<ChatMessage & { sources?: SourceInfo[]; suggestedActions?: string[]; latencyMs?: number; trace?: ChatTraceItem[] }>>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, loading]);

  const handleSend = async (messageText?: string) => {
    const text = (messageText || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setLoading(true);

    try {
      // Build history for backend
      const historyPayload: ChatMessage[] = newHistory.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await chatService.sendMessage({
        message: text,
        history: historyPayload,
      });

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.response || "Je n'ai pas pu obtenir de réponse.",
          sources: res.sources || [],
          suggestedActions: res.suggestedActions || [],
          latencyMs: res.latencyMs,
          trace: res.trace || [],
        },
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "⚠️ Une erreur est survenue lors de la communication avec l'assistant intelligent. Assurez-vous que le serveur backend IA est bien actif.",
          suggestedActions: ["Quel est le format de l'examen PSM I ?", "Quelles certifs prioritaires pour ma squad ?"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const getSourceIcon = (type?: string | null) => {
    const normalizedType = (type || '').toLowerCase();
    if (normalizedType.includes('sql') || normalizedType.includes('db')) {
      return <Database className="w-3.5 h-3.5 text-indigo-500" />;
    }
    if (normalizedType.includes('web') || normalizedType.includes('site')) {
      return <Globe className="w-3.5 h-3.5 text-emerald-500" />;
    }
    return <Layers className="w-3.5 h-3.5 text-[#b70f30]" />;
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center group">
          {/* Subtle Tooltip Label */}
          <div className="hidden md:flex items-center gap-1.5 mr-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-red-100 text-xs font-semibold text-gray-800 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100">
            <Sparkles className="w-3.5 h-3.5 text-[#b70f30] animate-pulse" />
            <span>Assistant IA CertifHub</span>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#b70f30] via-[#c9184a] to-[#ff4d6d] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center border-2 border-white/60 focus:outline-none focus:ring-4 focus:ring-[#b70f30]/20"
            title="Ouvrir l'assistant intelligent CertifHub"
          >
            <div className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
            </div>
            <Bot className="w-7 h-7 text-white animate-pulse" />
          </button>
        </div>
      )}

      {/* Floating Assistant Modal Panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[450px] max-w-[460px] h-[620px] max-h-[88vh] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#8a0b24] via-[#b70f30] to-[#c9184a] text-white px-5 py-4 flex items-center justify-between shadow-md relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white tracking-tight">Assistant CertifHub</h3>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                    RAG IA
                  </span>
                </div>
                <p className="text-[11px] text-white/80 font-medium">
                  {user?.firstName ? `Bonjour ${user.firstName}` : 'Guide Certifications & Squads'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 relative z-10">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Effacer l'historique"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/60 via-white to-gray-50/40">
            {/* Welcome & FAQ Screen when empty */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-3 py-6 space-y-5 animate-in fade-in duration-300">
                <div className="w-14 h-14 rounded-3xl bg-red-50 text-[#b70f30] border border-red-100 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-7 h-7 text-[#b70f30]" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-gray-900">Comment puis-je vous aider aujourd'hui ?</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Posez vos questions sur le catalogue de 53 certifications, les priorités de squad, les prix, les formats d'examen ou votre plan de carrière.
                  </p>
                </div>

                <div className="w-full space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block text-left px-1">
                    Questions fréquentes
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {STARTER_FAQS.map((faq, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(faq.query)}
                        className="w-full text-left p-3 rounded-2xl bg-white hover:bg-red-50/70 border border-gray-100 hover:border-red-200 transition-all duration-200 flex items-center justify-between group shadow-2xs hover:shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-[#b70f30] text-[18px]">
                            {faq.icon}
                          </span>
                          <span className="text-xs font-semibold text-gray-800 group-hover:text-[#b70f30] transition-colors">
                            {faq.title}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#b70f30] transform group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Message List */}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {msg.role === 'assistant' && <ResearchTrace trace={msg.trace || []} />}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-2xs ${
                    msg.role === 'user'
                      ? 'bg-[#b70f30] text-white rounded-br-xs'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-bl-xs'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <MarkdownView content={msg.content || ''} />
                  )}
                </div>

                {/* Sources & Citations if available */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 ml-1 max-w-[90%] space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      Sources vérifiées
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((src, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-50 border border-gray-200/80 text-[11px] font-medium text-gray-700 hover:bg-gray-100 transition-colors shadow-2xs"
                        >
                          {getSourceIcon(src.type)}
                          <span className="truncate max-w-[180px] font-semibold">{src.title || 'Source CertificationHub'}</span>
                          {src.url && (
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-gray-400 hover:text-[#b70f30]"
                              title="Consulter le lien officiel"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Actions Chips */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="mt-2.5 ml-1 max-w-[95%] space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Suggestions :
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedActions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleSend(action)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 hover:bg-red-100/80 text-[#b70f30] border border-red-100 text-xs font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <span>{action}</span>
                          <ArrowRight className="w-3 h-3 opacity-70" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Latency badge */}
                {msg.latencyMs !== undefined && msg.latencyMs > 0 && (
                  <span className="mt-1 ml-1 text-[9px] text-gray-300 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {msg.latencyMs}ms
                  </span>
                )}
              </div>
            ))}

            {/* Loading / Typing Animation */}
            {loading && (
              <div className="flex items-start gap-2 animate-in fade-in duration-200">
                <div className="w-7 h-7 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[#b70f30]">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-xs px-4 py-3 shadow-2xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#b70f30] animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#b70f30] animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#b70f30] animate-bounce"></span>
                  <span className="text-xs text-gray-400 font-medium ml-2">Recherche intelligente en cours...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input & Footer */}
          <div className="p-3.5 bg-white border-t border-gray-100">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez une question sur les certifications..."
                disabled={loading}
                className="w-full pl-4 pr-12 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#b70f30] focus:bg-white focus:ring-3 focus:ring-[#b70f30]/10 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputMessage.trim() || loading}
                className="absolute right-2 p-2 rounded-xl bg-[#b70f30] hover:bg-[#960c27] text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-2xs flex items-center justify-center"
                title="Envoyer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 text-center">
              <span className="text-[10px] text-gray-400">
                Alimenté par Groq GPT-OSS • CertifHub AI Engine
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
