import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

import type { TextItem } from 'pdfjs-dist/types/src/display/api';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;


 async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
   


    const pageText = content.items.map((item) => (item as TextItem).str).join(' ');
    text += pageText + '\n';
  }
  return text;
}

 async function extractTextFromDocx(file: File): Promise<string> {
  try {
    // Get the file data as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Mammoth extracts the raw text from the document
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    return result.value;
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    throw new Error("Failed to read DOCX file.");
  }
}


export async function processFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // 1. PDF Documents
  if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
    return await extractTextFromPDF(file);
  } 
  
  // 2. Word Documents (.docx)
  else if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
    fileName.endsWith('.docx')
  ) {
    return await extractTextFromDocx(file);
  } 
  
  // 3. Plain Text, CSV, and HTML
  else if (
    file.type === 'text/plain' || fileName.endsWith('.txt') ||
    file.type === 'text/csv' || fileName.endsWith('.csv') ||
    file.type === 'text/html' || fileName.endsWith('.html') || fileName.endsWith('.htm')
  ) {
    // Read the file natively as text
    return await file.text();
  } 
  
  // Unsupported types
  else {
    throw new Error(`Unsupported file type: ${file.name}`);
  }
}