/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface FileData {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  base64?: string;
  detectedType?: string;
  originalFile?: File;
}

export interface InputData {
  id: string;
  file: FileData;
  timestamp: number;
}

export interface BrainAnalysis {
  summary: string;
  key_insights: string[];
  connections: string[];
  suggested_actions: string[];
  sentiment: {
    label: 'Positive' | 'Neutral' | 'Negative' | 'Mixed';
    score: number; // 0 to 100
    explanation: string;
  };
  content_type: string;
  metadata_extracted: Record<string, any>;
}

export interface ProcessedResult {
  id: string;
  input: InputData;
  output: BrainAnalysis | null;
  logs: string[];
  durationMs: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}
