import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
import mammoth from 'mammoth';



 async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log(`Starting PDF extraction for: ${file.name} (Size: ${file.size} bytes)`);
    
    const arrayBuffer = await file.arrayBuffer();
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    console.log(`PDF loaded. Total pages: ${pdf.numPages}`);
    let text = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      text += pageText + '\n';
    }
    
    console.log("PDF extraction successful. Extracted characters:", text.length);
    return text;
  } catch (error) {
    const err = error as any;
    console.error("PDF.js Extraction Error:", error);
    console.error("Error name:", err?.name);
    console.error("Error message:", err?.message);
    console.error("Error details:", JSON.stringify(err, null, 2));
    throw new Error("Failed to extract text from PDF. Check console for details.");
    
  }
}

 async function extractTextFromDocx(file: File): Promise<string> {
  try {
    // Get the file data as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Mammoth extracts the raw text from the document
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    return result.value;
  } catch (error) {
    const err = error as any;
    console.error("Error extracting text from DOCX:", err);
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
  
  // 3. Plain Text, CSV, HTML, and Markdown
  else if (
    file.type === 'text/plain' || fileName.endsWith('.txt') ||
    file.type === 'text/csv' || fileName.endsWith('.csv') ||
    file.type === 'text/html' || fileName.endsWith('.html') || fileName.endsWith('.htm') ||
    file.type === 'text/markdown' || fileName.endsWith('.md')
  ) {
    // Read the file natively as text
    return await file.text();
  } 
  
  // Unsupported types
  else {
    throw new Error(`Unsupported file type: ${file.name}`);
  }
}