/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { InputData, ProcessedResult, FileData } from './types';
import { analyzeContentWithFlash } from './services/geminiService';
import { DataCard } from './components/DataCard';
import { LogTerminal } from './components/LogTerminal';
import { Brain, Upload, Play, Database, FileText, Image as ImageIcon, Music, Video, FileCode, Trash2, Sparkles, Activity, Download, AlertCircle, Zap, Scissors, Minimize2, FileOutput } from 'lucide-react';
import { optimizationService, OptimizationResult } from './services/optimizationService';

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass-panel fiber-border fiber-border-red p-10 max-w-md text-center">
            <AlertCircle className="text-red-500 mx-auto mb-6" size={48} />
            <h2 className="text-xl font-bold text-white mb-4">Neural Engine Failure</h2>
            <p className="text-white/60 text-sm mb-6 leading-relaxed">
              The synthesis engine encountered a critical error. This may be due to a malformed data stream or hardware desync.
            </p>
            <div className="bg-black/40 p-4 rounded-xl mb-6 text-left overflow-x-auto">
              <code className="text-red-400 text-xs font-mono">{this.state.error?.message}</code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-red-500/20 text-red-400 border border-red-500/30 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-red-500/30 transition-colors"
            >
              Restart Engine
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [queue, setQueue] = useState<InputData[]>([]);
  const [resolutionHistory, setResolutionHistory] = useState<ProcessedResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [avgLatency, setAvgLatency] = useState(0);
  const [optimizingId, setOptimizingId] = useState<string | null>(null);
  const [optimizationResults, setOptimizationResults] = useState<Record<string, OptimizationResult>>({});

  const queueRef = useRef<InputData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAtBottomRef = useRef(true);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollY, innerHeight } = window;
      const { scrollHeight } = document.documentElement;
      const isAtBottom = scrollHeight - (scrollY + innerHeight) < 150;
      isAtBottomRef.current = isAtBottom;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) {
      const timeoutId = setTimeout(() => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [resolutionHistory]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let files: FileList | null = null;
    if ('files' in e.target && e.target.files) {
      files = e.target.files;
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      files = e.dataTransfer.files;
    }

    if (!files) return;

    const newItems: InputData[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await fileToBase64(file);
      
      // Improved content type detection
      let detectedType = file.type;
      if (!detectedType) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const mimeMap: Record<string, string> = {
          'pdf': 'application/pdf',
          'js': 'text/javascript',
          'ts': 'text/typescript',
          'py': 'text/x-python',
          'md': 'text/markdown',
          'csv': 'text/csv',
          'json': 'application/json'
        };
        detectedType = mimeMap[ext || ''] || 'application/octet-stream';
      }

      newItems.push({
        id: Math.random().toString(36).substring(7).toUpperCase(),
        file: {
          name: file.name,
          type: file.type || detectedType,
          size: file.size,
          lastModified: file.lastModified,
          base64: base64.split(',')[1], // Just the data part
          detectedType: detectedType,
          originalFile: file
        },
        timestamp: Date.now()
      });
    }

    setQueue(prev => [...prev, ...newItems]);
    queueRef.current = [...queueRef.current, ...newItems];
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const processQueue = async () => {
    if (isProcessing || queueRef.current.length === 0) return;
    setIsProcessing(true);

    const processItem = async () => {
      if (queueRef.current.length === 0) {
        setIsProcessing(false);
        return;
      }

      const item = queueRef.current.shift();
      setQueue([...queueRef.current]);

      if (!item) return;

      const tempResult: ProcessedResult = {
          id: item.id,
          input: item,
          output: null,
          logs: ["Initializing neural pathways...", "Ingesting multimodal stream..."],
          durationMs: 0,
          status: 'processing',
      };

      setResolutionHistory(prev => [...prev, tempResult]);

      const start = performance.now();
      const result = await analyzeContentWithFlash(item);
      const duration = performance.now() - start;

      setResolutionHistory(prev => prev.map(r => {
        if (r.id === item.id) {
          return {
            ...r,
            output: result.json,
            logs: result.logs,
            durationMs: duration,
            status: 'completed'
          };
        }
        return r;
      }));

      setProcessedCount(prev => prev + 1);
      setAvgLatency(prev => (prev * processedCount + duration) / (processedCount + 1));

      if (queueRef.current.length > 0) {
        setTimeout(processItem, 1500); 
      } else {
        setIsProcessing(false);
      }
    };

    processItem();
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={16} />;
    if (type.startsWith('audio/')) return <Music size={16} />;
    if (type.startsWith('video/')) return <Video size={16} />;
    if (type.includes('javascript') || type.includes('json') || type.includes('typescript')) return <FileCode size={16} />;
    return <FileText size={16} />;
  };

  const clearQueue = () => {
    setQueue([]);
    queueRef.current = [];
    setOptimizationResults({});
  };

  const optimizeFile = async (id: string, mode: 'text' | 'image' | 'structure') => {
    const item = queue.find(i => i.id === id);
    if (!item || !item.file.originalFile) return;

    setOptimizingId(id);
    try {
      const file = item.file.originalFile;
      let result: OptimizationResult;
      
      if (mode === 'text') {
        result = await optimizationService.extractTextFromPdf(file);
      } else if (mode === 'image') {
        result = await optimizationService.compressImage(file);
      } else {
        result = await optimizationService.optimizePdfStructure(file);
      }

      setOptimizationResults(prev => ({ ...prev, [id]: result }));
      
      // Update the queue item with the optimized version for analysis
      const reader = new FileReader();
      reader.readAsDataURL(result.blob);
      reader.onload = () => {
        const optimizedBase64 = (reader.result as string).split(',')[1];
        setQueue(prev => prev.map(q => q.id === id ? {
          ...q,
          file: {
            ...q.file,
            name: result.name,
            size: result.optimizedSize,
            type: result.type,
            base64: optimizedBase64,
            originalFile: new File([result.blob], result.name, { type: result.type })
          }
        } : q));
      };
    } catch (err) {
      console.error("Optimization failed:", err);
    } finally {
      setOptimizingId(null);
    }
  };

  const downloadOptimized = (id: string) => {
    const result = optimizationResults[id];
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadResult = (result: ProcessedResult, format: 'json' | 'markdown') => {
    if (!result.output) return;
    
    let content = '';
    let fileName = `OmniBrain_${result.id}`;
    let mimeType = '';

    if (format === 'json') {
      content = JSON.stringify(result.output, null, 2);
      fileName += '.json';
      mimeType = 'application/json';
    } else {
      content = `# OmniBrain Synthesis: ${result.input.file.name}\n\n`;
      content += `## Summary\n${result.output.summary}\n\n`;
      content += `## Key Insights\n${result.output.key_insights.map(i => `- ${i}`).join('\n')}\n\n`;
      content += `## Neural Connections\n${result.output.connections.join(', ')}\n\n`;
      content += `## Suggested Reorientation\n${result.output.suggested_actions.map(a => `- ${a}`).join('\n')}\n\n`;
      content += `## Sentiment\n**Label:** ${result.output.sentiment.label}\n**Score:** ${result.output.sentiment.score}/100\n**Explanation:** ${result.output.sentiment.explanation}\n\n`;
      content += `## Metadata\n${JSON.stringify(result.output.metadata_extracted, null, 2)}\n`;
      fileName += '.md';
      mimeType = 'text/markdown';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen p-6 font-sans selection:bg-[#00FF00]/30">
      
      {/* Top App Bar */}
      <header className="max-w-[1600px] mx-auto mb-10 flex flex-col md:flex-row justify-between items-center pb-8 border-b border-white/10">
        <div className="flex items-center gap-5">
          <div className="glass-panel p-4 relative group">
            <div className="absolute inset-0 bg-[#00FF00]/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Brain className="text-[#00FF00] relative z-10" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-light text-[#FFFFFF] tracking-tight flex items-center gap-3">
              OmniBrain <span className="text-[10px] bg-[#00FF00]/10 text-[#00FF00] px-2 py-0.5 rounded border border-[#00FF00]/20 font-mono tracking-widest uppercase">v2.5</span>
            </h1>
            <p className="text-white/60 text-sm mt-1 max-w-2xl font-light">
              A high-bandwidth multimodal synthesis engine. Drop any data dump (PDF, Img, Audio, Video) to <span className="text-[#00FF00] font-medium">reorient</span>, <span className="text-[#00FF00] font-medium">compress</span>, and extract neural insights in real-time.
            </p>
          </div>
        </div>
        
        <div className="flex gap-4 mt-6 md:mt-0">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 hover:text-[#FFFFFF] transition-all text-xs font-bold uppercase tracking-widest"
          >
            <Upload size={16} />
            Ingest Files
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            multiple 
            className="hidden" 
          />
          <button 
            onClick={processQueue}
            disabled={isProcessing || queue.length === 0}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all fiber-border ${
              isProcessing || queue.length === 0
                ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10' 
                : 'bg-[#00FF00]/10 text-[#00FF00] hover:bg-[#00FF00]/20 border border-[#00FF00]/30 shadow-[0_0_20px_rgba(0,255,0,0.1)]'
            }`}
          >
            <Play size={16} fill="currentColor" />
            {isProcessing ? 'Synthesizing...' : 'Run Analysis'}
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Col: Ingestion Queue */}
        <section className="lg:col-span-3 flex flex-col gap-6 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
           
           <div className="flex flex-col gap-4 flex-1 min-h-0">
               <div className="flex justify-between items-center px-1">
                    <h2 className="text-xs font-bold text-white/60 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Database size={14} /> 
                        Ingestion Queue
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-white/40">{queue.length} items</span>
                      {queue.length > 0 && (
                        <button onClick={clearQueue} className="text-white/40 hover:text-[#FF4444] transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
               </div>
               
               <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleFileUpload(e); }}
                  className="glass-panel fiber-border p-3 flex-1 overflow-hidden flex flex-col min-h-[300px]"
                >
                 <div className="flex-1 overflow-y-auto space-y-2 p-1 custom-scrollbar">
                   {queue.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full text-white/20 border-2 border-dashed border-white/10 rounded-2xl m-2">
                        <Upload size={32} className="opacity-20 mb-4" />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Drop Files Here</span>
                     </div>
                   )}
                   {queue.map((item) => (
                     <div key={item.id} className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col gap-3 group hover:border-[#00FF00]/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="bg-white/5 p-2 rounded-lg text-white/40 group-hover:text-[#00FF00] transition-colors">
                            {getFileIcon(item.file.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-medium text-[#E6E6E6] truncate">{item.file.name}</div>
                            <div className="text-[9px] text-white/40 font-mono uppercase">
                              {(item.file.size / 1024).toFixed(1)} KB
                              {optimizationResults[item.id] && (
                                <span className="ml-2 text-[#00FF00]">
                                  (-{optimizationResults[item.id].compressionRatio.toFixed(0)}%)
                                </span>
                              )}
                            </div>
                          </div>
                          {optimizingId === item.id ? (
                            <div className="animate-spin text-[#00FF00]">
                              <Activity size={14} />
                            </div>
                          ) : (
                            <button 
                              onClick={() => setQueue(prev => prev.filter(q => q.id !== item.id))}
                              className="text-white/20 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        {/* Optimization Controls */}
                        <div className="flex gap-2 pt-1 border-t border-white/5">
                          {item.file.type === 'application/pdf' && !optimizationResults[item.id] && (
                            <>
                              <button 
                                onClick={() => optimizeFile(item.id, 'text')}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/5 text-[9px] uppercase font-bold text-white/40 hover:bg-[#00FF00]/10 hover:text-[#00FF00] transition-all"
                                title="Extract text for NotebookLM"
                              >
                                <Scissors size={10} />
                                NotebookLM
                              </button>
                              <button 
                                onClick={() => optimizeFile(item.id, 'structure')}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/5 text-[9px] uppercase font-bold text-white/40 hover:bg-white/10 hover:text-white transition-all"
                              >
                                <Minimize2 size={10} />
                                Compress
                              </button>
                            </>
                          )}
                          {item.file.type.startsWith('image/') && !optimizationResults[item.id] && (
                            <button 
                              onClick={() => optimizeFile(item.id, 'image')}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/5 text-[9px] uppercase font-bold text-white/40 hover:bg-[#00FF00]/10 hover:text-[#00FF00] transition-all"
                            >
                              <Zap size={10} />
                              Optimize
                            </button>
                          )}
                          {optimizationResults[item.id] && (
                            <button 
                              onClick={() => downloadOptimized(item.id)}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#00FF00]/10 text-[9px] uppercase font-bold text-[#00FF00] hover:bg-[#00FF00]/20 transition-all"
                            >
                              <FileOutput size={10} />
                              Download Optimized
                            </button>
                          )}
                        </div>
                     </div>
                   ))}
                 </div>
               </div>
           </div>

           {/* Stats Panel */}
           <div className="glass-panel fiber-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={14} className="text-[#00FF00]" />
                <h3 className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Engine Metrics</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[9px] text-white/40 uppercase mb-1">Synthesized</div>
                  <div className="text-xl font-light text-[#FFFFFF]">{processedCount}</div>
                </div>
                <div>
                  <div className="text-[9px] text-white/40 uppercase mb-1">Avg Latency</div>
                  <div className="text-xl font-light text-[#FFFFFF]">{avgLatency > 0 ? `${(avgLatency / 1000).toFixed(2)}s` : '--'}</div>
                </div>
                <div className="col-span-2 pt-2 border-t border-white/5">
                  <div className="text-[9px] text-white/40 uppercase mb-1">Data Optimized</div>
                  <div className="text-xl font-light text-[#00FF00]">
                    {Object.values(optimizationResults).reduce((acc, curr) => acc + (curr.originalSize - curr.optimizedSize), 0) > 0 
                      ? `${(Object.values(optimizationResults).reduce((acc, curr) => acc + (curr.originalSize - curr.optimizedSize), 0) / (1024 * 1024)).toFixed(2)} MB`
                      : '0.00 MB'}
                  </div>
                </div>
              </div>
           </div>
        </section>

        {/* Right Col: Synthesis Feed */}
        <section className="lg:col-span-9 space-y-10 pb-20">
          
          {resolutionHistory.length === 0 && !isProcessing && (
            <div className="flex flex-col items-center justify-center py-40 opacity-20">
               <Sparkles size={80} className="mb-6" />
               <h2 className="text-2xl font-light uppercase tracking-[0.3em]">Neural Feed Idle</h2>
            </div>
          )}

          <AnimatePresence initial={false}>
            {resolutionHistory.map((result) => (
              <motion.div 
                key={result.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-12"
              >
                  {/* Result Main Card */}
                  <div className="xl:col-span-8 fiber-border">
                    <DataCard 
                      data={result.output} 
                      loading={result.status === 'processing'} 
                      onDownload={(format) => downloadResult(result, format)}
                    />
                  </div>
                  
                  {/* Result Logs */}
                  <div className="xl:col-span-4 h-full min-h-[300px] fiber-border">
                    <LogTerminal logs={result.logs} type="flash" />
                  </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isProcessing && queue.length > 0 && (
            <div className="flex items-center justify-center py-10 gap-4">
               <div className="w-2 h-2 rounded-full bg-[#00FF00] animate-bounce"></div>
               <div className="w-2 h-2 rounded-full bg-[#00FF00] animate-bounce [animation-delay:0.2s]"></div>
               <div className="w-2 h-2 rounded-full bg-[#00FF00] animate-bounce [animation-delay:0.4s]"></div>
               <span className="text-[10px] uppercase tracking-[0.3em] text-[#00FF00] font-bold ml-2">Next item in buffer...</span>
            </div>
          )}
        </section>

      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #2D2E32;
          border-radius: 20px;
        }
      `}</style>
    </div>
    </ErrorBoundary>
  );
};

export default App;
