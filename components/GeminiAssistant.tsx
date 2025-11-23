import React, { useState, useRef, useEffect } from 'react';
import { CountryCode } from '../types';
import { queryGemini } from '../services/geminiService';

interface Props {
  country: CountryCode;
  countryName: string;
}

interface Message {
  role: 'user' | 'ai';
  text: string;
}

export const GeminiAssistant: React.FC<Props> = ({ country, countryName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: `Hello! I'm your AI Tax Assistant. I can look up the very latest 2025 tax changes, specific deductions, or nearby tax offices for ${countryName}. Ask me anything!` }
  ]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
        scrollToBottom();
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen]);

  // Request location on mount
  useEffect(() => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                console.log("Location access denied or error:", error);
            }
        );
    }
  }, []);

  // Reset chat when country changes
  useEffect(() => {
    setMessages([{ role: 'ai', text: `Hello! I'm your AI Tax Assistant. I can look up the very latest 2025 tax changes, specific deductions, or nearby tax offices for ${countryName}.` }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || query;
    if (!textToSend.trim()) return;

    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setLoading(true);

    const response = await queryGemini(textToSend, countryName, location);

    setMessages(prev => [...prev, { role: 'ai', text: response }]);
    setLoading(false);
  };

  const handleClear = () => {
      setMessages([{ role: 'ai', text: `Chat cleared. How else can I help you with ${countryName} taxes?` }]);
  };

  const quickPrompts = [
    "How can I reduce my tax?",
    "Explain the main deductions",
    "Find nearest tax office",
    "Cost of living estimate",
    "Compare to USA"
  ];

  // Simple function to render text with markdown-style links
  const renderMessageWithLinks = (text: string) => {
    const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
    
    return parts.map((part, index) => {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        return (
          <a 
            key={index} 
            href={match[2]} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-400 underline decoration-blue-500/30 break-all font-semibold"
          >
            {match[1]} <i className="fas fa-external-link-alt text-[10px] ml-0.5 opacity-70"></i>
          </a>
        );
      }
      // Basic bold formatting
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={index}>
            {boldParts.map((subPart, j) => {
                if (subPart.startsWith('**') && subPart.endsWith('**')) {
                    return <strong key={j} className="font-extrabold text-current opacity-100">{subPart.slice(2, -2)}</strong>;
                }
                return subPart;
            })}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating Button with Pulse Effect */}
      <div className="fixed bottom-6 right-6 z-[150] flex flex-col items-end gap-2">
          {!isOpen && (
            <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl animate-bounce mr-2 hidden md:block border border-white/10">
                Need tax help? Ask AI!
                <div className="absolute right-[-6px] bottom-3 w-3 h-3 bg-slate-900 rotate-45 border-r border-b border-white/10"></div>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`relative group bg-slate-900 dark:bg-white text-white dark:text-black rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:scale-105 transition-all duration-300 flex items-center justify-center border border-white/10 ${isOpen ? 'w-14 h-14' : 'w-16 h-16'}`}
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-full bg-blue-500 blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
            
            <div className="relative z-10 flex items-center justify-center">
                {isOpen ? (
                    <i className="fas fa-times text-2xl transition-transform duration-300 rotate-90 group-hover:rotate-0"></i>
                ) : (
                    <i className="fas fa-sparkles text-2xl animate-pulse"></i>
                )}
            </div>
          </button>
      </div>

      {/* Modern Glass Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:right-6 w-[92vw] md:w-[400px] h-[600px] max-h-[80vh] flex flex-col z-[150] animate-in slide-in-from-bottom-10 fade-in duration-300 origin-bottom-right">
          
          {/* Backdrop Blur Container */}
          <div className="absolute inset-0 bg-white/90 dark:bg-[#050505]/80 backdrop-blur-2xl rounded-[32px] border border-white/20 dark:border-white/10 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
              
              {/* Header */}
              <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-white/5 shrink-0 z-20">
                <div className="flex items-center gap-3">
                   <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 ring-2 ring-white/20">
                       <i className="fas fa-robot text-white text-sm"></i>
                   </div>
                   <div>
                       <h3 className="font-bold text-slate-800 dark:text-white leading-tight text-[15px]">Tax Assistant</h3>
                       <div className="flex items-center gap-1.5">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                           <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Gemini 2.5 • Online</span>
                       </div>
                   </div>
                </div>
                <button 
                    onClick={handleClear} 
                    className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors"
                    title="Clear Chat"
                >
                    <i className="fas fa-trash-alt text-xs"></i>
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-end gap-3'}`}>
                    
                    {/* AI Avatar */}
                    {msg.role === 'ai' && (
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0 mb-1 border border-black/5 dark:border-white/5">
                            <i className="fas fa-robot text-[10px] text-slate-500 dark:text-slate-400"></i>
                        </div>
                    )}

                    <div className={`max-w-[85%] p-3.5 px-4 rounded-2xl text-[13.5px] leading-relaxed shadow-sm relative group ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-none shadow-blue-500/20' 
                        : 'bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-200 rounded-bl-none border border-gray-100 dark:border-white/5'
                    }`}>
                      <div className="whitespace-pre-wrap font-medium">
                          {renderMessageWithLinks(msg.text)}
                      </div>
                      
                      {/* Timestamp/Status (Visual only) */}
                      {idx === messages.length - 1 && (
                          <div className={`text-[9px] mt-1 opacity-0 group-hover:opacity-60 transition-opacity absolute -bottom-5 ${msg.role === 'user' ? 'right-0' : 'left-0'} text-slate-400 whitespace-nowrap font-medium`}>
                              {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {loading && (
                  <div className="flex justify-start items-end gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0 mb-1">
                         <i className="fas fa-robot text-[10px] text-slate-500 dark:text-slate-400"></i>
                    </div>
                    <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl rounded-bl-none border border-gray-100 dark:border-white/5 shadow-sm">
                      <div className="flex space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce delay-75"></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce delay-150"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-2" />
              </div>
              
              {/* Footer Actions */}
              <div className="p-4 pt-0 bg-gradient-to-t from-white via-white to-transparent dark:from-[#050505] dark:via-[#050505] dark:to-transparent z-20">
                {/* Quick Chips */}
                <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-3 scrollbar-hide mask-linear-fade">
                    {quickPrompts.map((p, i) => (
                        <button 
                            key={i}
                            onClick={() => handleSend(p)}
                            disabled={loading}
                            className="px-3 py-1.5 bg-slate-50 dark:bg-[#1c1c1e] hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-200 dark:border-white/10 hover:border-blue-200 dark:hover:border-blue-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-bold rounded-lg transition-all active:scale-95 shadow-sm"
                        >
                            {p}
                        </button>
                    ))}
                </div>

                {/* Floating Input */}
                <div className="relative flex items-center">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your question..."
                        className="w-full pl-5 pr-12 py-3.5 rounded-2xl bg-slate-100 dark:bg-[#151517] border border-transparent focus:bg-white dark:focus:bg-[#1c1c1e] focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 transition-all shadow-inner"
                    />
                    <button 
                        onClick={() => handleSend()}
                        disabled={loading || !query.trim()}
                        className="absolute right-2 w-9 h-9 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all active:scale-90"
                    >
                        {loading ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className="fas fa-paper-plane text-xs"></i>}
                    </button>
                </div>
                
                <div className="text-[10px] text-center text-slate-400 mt-2 font-medium opacity-60">
                    AI can make mistakes. Please verify important details.
                </div>
              </div>
          </div>
        </div>
      )}
    </>
  );
};
