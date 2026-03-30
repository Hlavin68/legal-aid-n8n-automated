import React, { forwardRef } from 'react';
import MessageBubble from './MessageBubble';
import './ChatContainer.css';

const ChatContainer = forwardRef(({ messages }, ref) => {
  return (
    <div className="chat-container">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} role={msg.role} text={msg.text} />
      ))}
      <div ref={ref} />
    </div>
  );
});

ChatContainer.displayName = 'ChatContainer';

export default ChatContainer;
