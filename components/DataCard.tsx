/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import { BrainAnalysis } from '../types';
import { Brain, Lightbulb, Link, ArrowRight, Info, Sparkles, FileText } from 'lucide-react';

interface DataCardProps {
  data: BrainAnalysis | null;
  loading: boolean;
  onDownload?: (format: 'json' | 'markdown') => void;
}

export const DataCard: React.FC<DataCardProps> = ({ data, loading, onDownload }) => {
  if (loading) {
    return (
      <div className="w-full glass-panel fiber-border p-12 flex flex-col items-center justify-center min-h-[400px] gap-6">
        <div className="relative w-20 h-20">
           <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
           <div className="absolute inset-0 rounded-full border-4 border-[#00FF00] border-t-transparent animate-spin shadow-[0_0_15px_rgba(0,255,0,0.4)]"></div>
           <Brain className="absolute inset-0 m-auto text-[#00FF00] animate-pulse" size={32} />
        </div>
        <div className="text-center">
          <p className="text-[#00FF00] font-mono text-sm tracking-widest uppercase mb-2">Neural Synthesis in Progress</p>
          <p className="text-white/60 text-xs">Reorienting multimodal data structures...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full glass-panel p-12 border-dashed flex items-center justify-center min-h-[400px]">
        <div className="text-center opacity-40">
            <Sparkles size={64} className="mx-auto text-white/40 mb-4" />
            <p className="text-white/40 font-mono text-sm uppercase tracking-widest">Awaiting Data Dump</p>
            <p className="text-white/20 text-xs mt-2 italic">Upload content to begin synthesis</p>
        </div>
      </div>
    );
  }

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'Positive': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'Negative': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'Mixed': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full glass-panel overflow-hidden transition-all duration-700"
    >
      
      {/* Header Section */}
      <div className="bg-white/5 px-8 py-5 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-3">
            <div className="bg-[#00FF00]/10 p-2 rounded-lg border border-[#00FF00]/20">
              <Brain size={20} className="text-[#00FF00]" />
            </div>
            <div>
              <span className="text-[#FFFFFF] font-medium tracking-tight text-lg">Synthesis Result</span>
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-mono">{data.content_type}</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-[#00FF00]/5 px-3 py-1 rounded-full border border-[#00FF00]/20">
            <div className="w-2 h-2 rounded-full bg-[#00FF00] animate-pulse"></div>
            <span className="text-[#00FF00] font-mono text-[10px] uppercase tracking-widest">Optimized</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => onDownload?.('markdown')}
              className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
              title="Download Markdown"
            >
              <FileText size={16} />
            </button>
            <button 
              onClick={() => onDownload?.('json')}
              className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
              title="Download JSON"
            >
              <ArrowRight size={16} className="rotate-90" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-10">
        
        {/* Summary & Sentiment Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          <div className="xl:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Info size={16} className="text-[#00FF00]" />
              <h3 className="text-[11px] uppercase tracking-[0.2em] text-white/60 font-bold">Executive Summary</h3>
            </div>
            <div className="text-[#E6E6E6] leading-relaxed text-lg font-light italic prose prose-invert max-w-none">
              <ReactMarkdown>{data.summary}</ReactMarkdown>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Sentiment Analysis</h3>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getSentimentColor(data.sentiment.label)}`}>
                {data.sentiment.label}
              </span>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] text-white/40 font-mono">Polarity Score</span>
                <span className="text-lg font-light text-white">{data.sentiment.score}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${data.sentiment.score}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className={`h-full ${data.sentiment.score > 60 ? 'bg-emerald-400' : data.sentiment.score < 40 ? 'bg-rose-400' : 'bg-blue-400'}`}
                />
              </div>
            </div>

            <p className="text-[11px] text-white/60 leading-relaxed italic">
              "{data.sentiment.explanation}"
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Insights Column */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Lightbulb size={16} className="text-[#00FF00]" />
              <h3 className="text-[11px] uppercase tracking-[0.2em] text-white/60 font-bold">Key Insights</h3>
            </div>
            <ul className="space-y-3">
              {data.key_insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-3 group">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#00FF00] shrink-0 group-hover:scale-125 transition-transform shadow-[0_0_8px_rgba(0,255,0,0.6)]"></div>
                  <div className="text-white/70 text-sm leading-snug prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{insight}</ReactMarkdown>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Connections Column */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Link size={16} className="text-[#00FF00]" />
              <h3 className="text-[11px] uppercase tracking-[0.2em] text-white/60 font-bold">Neural Connections</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.connections.map((conn, i) => (
                <div key={i} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs hover:border-[#00FF00]/30 hover:text-white transition-all cursor-default">
                  {conn}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Actionable Reorientation */}
        <section className="pt-8 border-t border-white/10">
          <div className="flex items-center gap-2 mb-6">
            <ArrowRight size={16} className="text-[#00FF00]" />
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-white/60 font-bold">Suggested Reorientation</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.suggested_actions.map((action, i) => (
              <div key={i} className="p-4 rounded-2xl bg-[#00FF00]/5 border border-[#00FF00]/10 hover:bg-[#00FF00]/10 transition-all group">
                <p className="text-[#00FF00]/80 text-xs font-medium leading-relaxed group-hover:text-[#00FF00] transition-colors">{action}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Metadata Footer */}
        {Object.keys(data.metadata_extracted).length > 0 && (
          <section className="bg-black/20 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Extracted Metadata</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(data.metadata_extracted).map(([key, val], i) => (
                <div key={i}>
                  <p className="text-[9px] text-white/30 uppercase mb-1">{key}</p>
                  <p className="text-[11px] text-white/50 font-mono truncate">{String(val)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </motion.div>
  );
};
