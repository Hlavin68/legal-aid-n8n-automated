import React, { useState, useRef, useEffect } from 'react';

function InputBox({ onSendMessage, onClear, isLoading }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

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

  return (
    <div className="d-flex align-items-end gap-2 w-100">

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