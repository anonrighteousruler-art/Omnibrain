/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION_BRAIN } from "../constants";
import { InputData, BrainAnalysis } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const analyzeContentWithFlash = async (input: InputData): Promise<{ json: BrainAnalysis | null, logs: string[] }> => {
  try {
    const ai = getClient();
    
    const parts: any[] = [
      { text: `Analyze this content: ${input.file.name} (${input.file.type})` }
    ];

    if (input.file.base64) {
      parts.push({
        inlineData: {
          mimeType: input.file.type || 'application/octet-stream',
          data: input.file.base64
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_BRAIN,
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || "{}";
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsedJson: BrainAnalysis | null = null;
    try {
      parsedJson = JSON.parse(jsonStr);
    } catch (e) {
      console.error("JSON Parse Error:", e, jsonStr);
      throw new Error("Failed to parse neural synthesis output. The data stream may be corrupted.");
    }

    return {
      json: parsedJson,
      logs: [
        `Ingested: ${input.file.name}`,
        `Detected MIME: ${input.file.type}`,
        `Neural Polarity: ${parsedJson?.sentiment.label} (${parsedJson?.sentiment.score}%)`,
        `Synthesis Complete.`
      ]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Brain Error:", error);
    return {
      json: null,
      logs: [
        `CRITICAL ERROR: Neural pathway blocked.`,
        `Details: ${errorMessage}`,
        `Attempting to recover...`
      ]
    };
  }
};
