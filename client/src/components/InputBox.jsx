import React, { useState } from 'react';
import './InputBox.css';

function InputBox({ onSendMessage, onClear, isLoading }) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    onClear();
    setMessage('');
  };

  return (
    <div className="input-container">
      <textarea
        className="input-box"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type your legal question..."
        disabled={isLoading}
        rows="1"
      />
      <button onClick={handleSend} disabled={isLoading || !message.trim()}>
        Send
      </button>
      <button className="clear-btn" onClick={handleClear} disabled={isLoading}>
        Clear
      </button>
    </div>
  );
}

export default InputBox;
