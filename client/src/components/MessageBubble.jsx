import React from 'react';
import './MessageBubble.css';

function MessageBubble({ role, text }) {
  const isUser = role === 'user';
  
  return (
    <div className={`message ${isUser ? 'user-message' : 'bot-message'}`}>
      {text}
    </div>
  );
}

export default MessageBubble;
