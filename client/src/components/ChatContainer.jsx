import React, { forwardRef } from 'react';
import MessageBubble from './MessageBubble'; // ✅ IMPORT IT

const ChatContainer = forwardRef(({ messages }, ref) => {
  return (
    <div className="d-flex flex-column h-100">

      {/* Welcome */}
      <div className="alert alert-primary m-3 shadow-sm">
        <h6 className="fw-bold mb-1">🏛️ Kenyan Legal AI Assistant</h6>
        <p className="mb-1 small">
          Get guidance on Kenyan law instantly.
        </p>
        <small className="text-muted">
          Topics: Land disputes, Employment, Family law, Criminal law, Contracts
        </small>
      </div>

      {/* Messages Area */}
      <div className="flex-grow-1 overflow-auto px-3 pb-3">

        {messages.slice(1).map((msg) => (
          <div
            key={msg.id}
            className={`d-flex mb-2 ${
              msg.role === 'user'
                ? 'justify-content-end'
                : 'justify-content-start'
            }`}
          >
            <MessageBubble role={msg.role} text={msg.text} />
          </div>
        ))}

        <div ref={ref} />
      </div>

      {/* Disclaimer */}
      <div className="text-center small text-muted pb-2">
        ⚠️ This AI provides general legal information.
      </div>

    </div>
  );
});

export default ChatContainer;