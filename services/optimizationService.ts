import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Set worker for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface OptimizationResult {
  blob: Blob;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  type: string;
  name: string;
}

export const optimizationService = {
  /**
   * Extracts text from a PDF to create a highly compressed text version
   * perfect for NotebookLM sources.
   */
  async extractTextFromPdf(file: File): Promise<OptimizationResult> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }

    const blob = new Blob([fullText], { type: 'text/plain' });
    const name = file.name.replace(/\.[^/.]+$/, "") + "_extracted.txt";

    return {
      blob,
      originalSize: file.size,
      optimizedSize: blob.size,
      compressionRatio: (1 - blob.size / file.size) * 100,
      type: 'text/plain',
      name
    };
  },

  /**
   * Compresses an image using Canvas downscaling
   */
  async compressImage(file: File, quality: number = 0.7): Promise<OptimizationResult> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas context not available');

        // Maintain aspect ratio but limit max dimension to 2048px for optimization
        const maxDim = 2048;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) return reject('Compression failed');
          
          const name = file.name.replace(/\.[^/.]+$/, "") + "_optimized.webp";
          resolve({
            blob,
            originalSize: file.size,
            optimizedSize: blob.size,
            compressionRatio: (1 - blob.size / file.size) * 100,
            type: 'image/webp',
            name
          });
        }, 'image/webp', quality);
      };
      img.onerror = reject;
    });
  },

  /**
   * Basic PDF optimization by removing unnecessary metadata or restructuring
   * (Limited client-side without heavy re-encoding)
   */
  async optimizePdfStructure(file: File): Promise<OptimizationResult> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Basic optimization: remove metadata and compress streams
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');
    
    const optimizedBytes = await pdfDoc.save({ useObjectStreams: true });
    const blob = new Blob([optimizedBytes], { type: 'application/pdf' });
    const name = file.name.replace(/\.[^/.]+$/, "") + "_optimized.pdf";

    return {
      blob,
      originalSize: file.size,
      optimizedSize: blob.size,
      compressionRatio: (1 - blob.size / file.size) * 100,
      type: 'application/pdf',
      name
    };
  }
};
