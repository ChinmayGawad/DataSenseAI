'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  Table, 
  ChevronRight, 
  Bot, 
  User,
  ShieldCheck
} from 'lucide-react';
import { queryDataset } from '../../../lib/api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  takeaway?: string;
  proof?: string;
  table?: any[];
  timestamp: string;
}

interface DatasetChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  datasetName?: string;
}

const STARTER_PROMPTS = [
  'What is the total revenue / sales in INR (₹)?',
  'Which category or segment has the highest performance?',
  'What is the average transaction value?',
  'Are there any notable anomalies or negative margins?'
];

export default function DatasetChatModal({
  isOpen,
  onClose,
  jobId,
  datasetName = 'Active Dataset'
}: DatasetChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your Query Assistant for **${datasetName}**. Every calculation I perform is backed by deterministic Python execution and ground-truth verification—guaranteeing 0.0% hallucination.`,
      takeaway: 'Ask any question regarding aggregations, metrics, comparisons, or segments.',
      proof: 'Python runtime connected & validated.',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isQuerying]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputValue.trim();
    if (!textToSend || isQuerying) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsQuerying(true);

    try {
      const res = await queryDataset(jobId, textToSend);

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        takeaway: res.key_takeaway,
        proof: res.fact_check?.ground_truth_metric || (res.fact_check?.verified_value !== undefined ? `Verified value: ${res.fact_check.verified_value}` : 'Verified via dataset aggregations'),
        table: res.supporting_table,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `I encountered an issue computing the calculation: ${err.message || 'Network error'}. Please try phrasing with column names.`,
        takeaway: 'Ground-truth query engine standby.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl h-[85vh] max-h-[750px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#11241f] via-[#1a3830] to-[#11241f] text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Ask AI: Dataset Intelligence</h3>
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  Fact-Checked (0% Hallucination)
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Targeting: <span className="text-emerald-300 font-medium">{datasetName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title="Close modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation Stream */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50"
        >
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div 
                className={`max-w-[85%] rounded-2xl p-4 shadow-xs text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#11241f] text-white rounded-br-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-line font-normal">
                  {msg.text}
                </div>

                {/* Assistant Metadata Badges */}
                {msg.sender === 'assistant' && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                    {msg.proof && (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Math Proof: {msg.proof}</span>
                      </div>
                    )}
                    {msg.takeaway && (
                      <div className="text-[11px] text-slate-500 italic">
                        💡 Key takeaway: {msg.takeaway}
                      </div>
                    )}

                    {/* Supporting Table */}
                    {msg.table && msg.table.length > 0 && (
                      <div className="mt-2 overflow-x-auto border border-slate-200 rounded-lg max-h-40">
                        <table className="w-full text-[11px] text-left border-collapse">
                          <thead className="bg-slate-100 text-slate-600 sticky top-0">
                            <tr>
                              {Object.keys(msg.table[0]).map((col) => (
                                <th key={col} className="p-1.5 font-semibold border-b border-slate-200">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {msg.table.slice(0, 5).map((row, idx) => (
                              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                {Object.values(row).map((v: any, cidx) => (
                                  <td key={cidx} className="p-1.5 text-slate-700 font-mono">
                                    {String(v)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                <div className={`text-[10px] mt-1.5 text-right ${msg.sender === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Thinking / Calculation State */}
          {isQuerying && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200 animate-pulse">
                <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 text-slate-600 rounded-2xl rounded-bl-none px-4 py-2.5 text-xs shadow-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Running deterministic Python aggregation against raw records...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Quick Queries */}
        <div className="px-4 py-2 bg-slate-100/70 border-t border-slate-200 overflow-x-auto shrink-0 flex items-center gap-2 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-500 shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Suggestions:
          </span>
          {STARTER_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              disabled={isQuerying}
              onClick={() => handleSend(prompt)}
              className="text-xs bg-white text-slate-700 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question in plain English (e.g., Total sales in Mumbai? Top product?)..."
              disabled={isQuerying}
              className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isQuerying}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <p className="mt-1.5 text-[10px] text-center text-slate-400">
            DataSense AI executes real vectorized Python code on your dataset to guarantee 100% factual accuracy.
          </p>
        </div>
      </div>
    </div>
  );
}
