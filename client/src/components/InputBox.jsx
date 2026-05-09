import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import mammoth from 'mammoth';

const pdfWorker = new Worker(new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url));
pdfjsLib.GlobalWorkerOptions.workerPort = pdfWorker;

function InputBox({ onSendMessage, onClear, isLoading }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    onClear();
    setMessage('');
  };

  // 🔥 AUTO RESIZE LOGIC
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto'; // reset height
    textarea.style.height = textarea.scrollHeight + 'px'; // expand
  }, [message]);

  const extractTextFromFile = async (file) => {
    const fileType = file.type;
    if (fileType === 'text/plain') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    } else if (fileType === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map(item => item.str).join(' ') + '\n';
      }
      return text;
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } else {
      throw new Error('Unsupported file type');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await extractTextFromFile(file);
      // Format as detailed legal analysis request
      const analysisMessage = `Please perform a comprehensive legal analysis of this ${file.name} document. Check for:

1. Document validity and completeness
2. Key clauses and their implications
3. Potential legal issues or risks
4. Compliance with Kenyan law
5. Missing or problematic provisions
6. Recommendations for improvements

Document content:
${text}`;
      setMessage(analysisMessage);
    } catch (error) {
      alert('Error extracting text from file: ' + error.message);
    }
    // Reset file input
    event.target.value = '';
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="d-flex align-items-end gap-2 w-100">

      {/* UPLOAD BUTTON */}
      <button
        className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
        style={{ width: '45px', height: '45px' }}
        onClick={handleUploadClick}
        disabled={isLoading}
        title="Upload document (PDF, DOCX, TXT)"
      >
        +
      </button>

      {/* HIDDEN FILE INPUT */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".pdf,.docx,.txt"
        onChange={handleFileUpload}
      />

      {/* TEXTAREA */}
      <textarea
        ref={textareaRef}
        className="form-control rounded-4 px-3 py-2"
        style={{
          resize: 'none',
          overflow: 'hidden',
          maxHeight: '150px'
        }}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your legal question..."
        disabled={isLoading}
        rows={1}
      />

      {/* SEND BUTTON */}
      <button
        className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center"
        style={{ width: '45px', height: '45px' }}
        onClick={handleSend}
        disabled={isLoading || !message.trim()}
      >
        {isLoading ? (
          <span className="spinner-border spinner-border-sm" />
        ) : (
          '➤'
        )}
      </button>

      {/* CLEAR BUTTON */}
      <button
        className="btn btn-outline-danger btn-sm rounded-pill"
        onClick={handleClear}
        disabled={isLoading}
      >
        Clear
      </button>

    </div>
  );
}

export default InputBox;