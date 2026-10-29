import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext.js';
import { api } from '../services/api.js';
import { IConversation, IChatMessage } from '../types/index.js';
import {
  MessageSquare,
  Send,
  Plus,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  CheckSquare2,
  HelpCircle,
  Lightbulb,
  Building,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { activeBusiness, latestAnalysis, refreshAll } = useBusiness();

  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [createdActionId, setCreatedActionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested contextual prompts based on active profile
  const suggestedPrompts = [
    `How can ${activeBusiness?.identity.businessName || 'my business'} get more sales this month?`,
    'What is the biggest problem in my business right now?',
    'What is the best way for me to get new customers?',
    'How can I increase my prices without losing customers?',
    'What repetitive daily tasks should I automate first?',
    'Give me a simple 7-day plan to get more clients.'
  ];

  useEffect(() => {
    if (!activeBusiness) return;

    const loadConversations = async () => {
      try {
        const convList = await api.getConversations(activeBusiness.id);
        setConversations(convList);
        if (convList.length > 0) {
          setCurrentConvId(convList[0].id);
        } else {
          // create initial conversation
          const newConv = await api.createConversation(activeBusiness.id, 'Chat with AI Coach');
          setConversations([newConv]);
          setCurrentConvId(newConv.id);
        }
      } catch (err) {
        console.warn('Failed loading conversations:', err);
      }
    };

    loadConversations();
  }, [activeBusiness]);

  useEffect(() => {
    if (!currentConvId) return;

    const loadMessages = async () => {
      try {
        const msgs = await api.getMessages(currentConvId);
        setMessages(msgs);
      } catch (err) {
        console.warn('Failed loading messages:', err);
      }
    };

    loadMessages();
  }, [currentConvId]);

  const location = useLocation();
  const promptFiredRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    const passedPrompt = (location.state as any)?.prompt;
    if (passedPrompt && currentConvId && !promptFiredRef.current && !sending) {
      promptFiredRef.current = true;
      handleSendMessage(passedPrompt);
    }
  }, [location.state, currentConvId, sending]);

  const handleStartNewChat = async () => {
    if (!activeBusiness) return;
    try {
      const newConv = await api.createConversation(activeBusiness.id, `Session ${conversations.length + 1}`);
      setConversations([newConv, ...conversations]);
      setCurrentConvId(newConv.id);
      setMessages([]);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || !currentConvId || sending) return;

    setInputMessage('');
    setSending(true);

    try {
      const res = await api.sendMessage(currentConvId, text.trim());
      setMessages((prev) => [...prev, res.userMessage, res.assistantMessage]);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddToActionItems = async (msg: IChatMessage) => {
    if (!activeBusiness || !msg.actionItemCandidate) return;
    try {
      await api.createActionItem(activeBusiness.id, {
        title: msg.actionItemCandidate.title,
        description: msg.actionItemCandidate.description,
        timeframe: msg.actionItemCandidate.timeframe,
        priority: msg.actionItemCandidate.priority,
        source: 'ai_chat',
        status: 'todo'
      });
      setCreatedActionId(msg.id);
      await refreshAll();
      setTimeout(() => setCreatedActionId(null), 3000);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (!activeBusiness) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-10 text-center space-y-4 max-w-xl mx-auto my-12">
        <Building className="w-12 h-12 text-blue-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Select a Business for AI Advisory</h2>
        <p className="text-xs text-slate-400">
          The AI Advisor requires your enterprise coordinates and strategic analysis to provide personalized consulting.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-4 overflow-hidden">
      {/* Chat Sidebar: Previous Conversations */}
      <div className="w-64 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between shrink-0 hidden md:flex p-3">
        <div className="space-y-3">
          <button
            onClick={handleStartNewChat}
            className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 pt-2">
            Past Chats
          </div>

          <div className="space-y-1 max-h-[calc(100vh-16rem)] overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setCurrentConvId(c.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs truncate transition-colors ${
                  currentConvId === c.id
                    ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <p className="font-semibold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> AI Business Coach
          </p>
          <p className="text-[10px] text-slate-400">Personalized using {activeBusiness.identity.businessName}'s profile and SWOT findings.</p>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between overflow-hidden">
        {/* Chat Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-5 py-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/20">
                <Bot className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                  <Sparkles className="w-3 h-3" />
                  <span>Google Gemini Live Connected</span>
                </div>
                <h3 className="text-xl font-bold text-white">
                  Chat with Your AI Business Coach
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                  I have your full business profile, SWOT findings, and revenue targets loaded. Click any question below to get instant practical advice!
                </p>
              </div>

              {/* Starter Question Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left pt-2">
                {[
                  {
                    icon: '🚀',
                    title: 'Get Clients Fast',
                    prompt: `How can ${activeBusiness.identity.businessName} get 5 new clients this month?`
                  },
                  {
                    icon: '💰',
                    title: 'Fix Pricing & Margins',
                    prompt: `How can I increase my prices and profit margins without losing customers?`
                  },
                  {
                    icon: '⚡',
                    title: 'Fix #1 Problem',
                    prompt: `What is the best way to fix my biggest problem: "${activeBusiness.challenges.biggestProblems[0] || 'inconsistent sales'}"?`
                  },
                  {
                    icon: '📋',
                    title: '7-Day Action Plan',
                    prompt: `Give me a simple 7-day step-by-step checklist to grow my business.`
                  }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all text-left space-y-1 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.icon}</span>
                      <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      "{item.prompt}"
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                    }`}
                  >
                    <div className="prose prose-invert max-w-none text-xs space-y-2 whitespace-pre-wrap">
                      {m.content}
                    </div>

                    {!isUser && (
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                        {m.sources && m.sources.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <span>Context:</span>
                            {m.sources.map((s, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 ml-auto">
                          {m.actionItemCandidate && (
                            <button
                              onClick={() => handleAddToActionItems(m)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                                createdActionId === m.id
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20'
                              }`}
                            >
                              <CheckSquare2 className="w-3 h-3" />
                              <span>{createdActionId === m.id ? 'Added to Tasks!' : 'Add as Action Item'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleCopy(m.id, m.content)}
                            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                            title="Copy response"
                          >
                            {copiedId === m.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {sending && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl text-xs text-slate-400 flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span>Thinking of the best advice for you...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar & Contextual Suggestions */}
        <div className="p-4 border-t border-slate-800 bg-[#090D16]/90 space-y-3">
          {/* Suggested Prompts Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
            <span className="text-slate-500 font-semibold shrink-0 flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-400" /> Suggestions:
            </span>
            {suggestedPrompts.slice(0, 3).map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white whitespace-nowrap shrink-0 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Textarea Input */}
          <div className="flex items-center gap-2">
            <textarea
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Ask any question about ${activeBusiness.identity.businessName}... (e.g. pricing, getting customers, saving time)`}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || sending}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-blue-600/30 transition-transform active:scale-95 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
