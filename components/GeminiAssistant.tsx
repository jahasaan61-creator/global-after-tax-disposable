
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
    { role: 'ai', text: `Hello! I'm your AI Tax Assistant. I can look up the very latest 2025 tax changes or specific deductions for ${countryName} using Google Search. Ask me anything!` }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  // Reset chat when country changes
  useEffect(() => {
    setMessages([{ role: 'ai', text: `Hello! I'm your AI Tax Assistant. I can look up the very latest 2025 tax changes or specific deductions for ${countryName}.` }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || query;
    if (!textToSend.trim()) return;

    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setLoading(true);

    const response = await queryGemini(textToSend, countryName);

    setMessages(prev => [...prev, { role: 'ai', text: response }]);
    setLoading(false);
  };

  const quickPrompts = [
    "How can I reduce my tax?",
    "Explain the main deductions",
    "Are there new 2025 tax credits?",
  ];

  // Simple function to render text with markdown-style links
  const renderMessageWithLinks = (text: string) => {
    // Regex to capture [Title](url)
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
            className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 break-all"
          >
            {match[1]} <i className="fas fa-external-link-alt text-[10px] ml-0.5"></i>
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform z-[150] flex items-center justify-center w-14 h-14"
        title="Ask AI Assistant"
      >
        {isOpen ? <i className="fas fa-times text-xl"></i> : <i className="fas fa-sparkles text-xl"></i>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 h-[550px] bg-white dark:bg-[#101012] rounded-xl shadow-2xl border border-slate-200 dark:border-[#222] flex flex-col z-[150] overflow-hidden animate-fade-in-up transition-colors">
          {/* Header */}
          <div className="bg-slate-900 dark:bg-black text-white p-4 flex items-center justify-between border-b border-slate-800 dark:border-[#222]">
            <div className="flex items-center gap-2">
               <i className="fas fa-robot text-blue-400"></i>
               <h3 className="font-bold">Tax Assistant</h3>
            </div>
            <span className="text-xs bg-blue-900 px-2 py-1 rounded border border-blue-700 font-semibold">Gemini 2.5</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#000]/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#333] text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm prose prose-sm dark:prose-invert'
                }`}>
                  <div className="whitespace-pre-wrap font-medium leading-relaxed">
                      {renderMessageWithLinks(msg.text)}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-[#1c1c1e] p-3 rounded-lg border border-slate-200 dark:border-[#333] shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Quick Chips */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-[#0a0a0a] flex gap-2 overflow-x-auto whitespace-nowrap border-t border-slate-100 dark:border-[#222] scrollbar-hide">
            {quickPrompts.map((p, i) => (
                <button 
                    key={i}
                    onClick={() => handleSend(p)}
                    disabled={loading}
                    className="px-3 py-1 bg-white dark:bg-[#1c1c1e] border border-blue-100 dark:border-[#333] text-blue-600 dark:text-blue-400 text-xs rounded-full hover:bg-blue-50 dark:hover:bg-[#2c2c2e] transition shadow-sm font-bold"
                >
                    {p}
                </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 bg-white dark:bg-[#101012] border-t border-slate-100 dark:border-[#222]">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about deductibles..."
                className="w-full pl-4 pr-10 py-2 rounded-full border border-slate-300 dark:border-[#333] bg-white dark:bg-[#1c1c1e] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium placeholder-slate-400 dark:placeholder-slate-500"
              />
              <button 
                onClick={() => handleSend()}
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50 p-1"
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
            <div className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-2 font-semibold">
              AI uses Google Search for verification. Double check sources.
            </div>
          </div>
        </div>
      )}
    </>
  );
};
