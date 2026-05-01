import React from 'react';

function MessageBubble({ role, text, className = '', style = {} }) {
  const isUser = role === 'user';
  
  // Format text to handle line breaks and list items
  const formatText = (str) => {
    if (!str) return '';
    
    // Split by newlines
    const lines = str.split(/\\n|\n/g).filter(line => line.trim());
    
    return lines.map((line, idx) => {
      // Match numbered items (1., 2., etc.)
      const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
      
      if (numberedMatch) {
        return (
          <div key={idx} className="list-item">
            <span className="list-number">{numberedMatch[1]}.</span>
            <span>{numberedMatch[2]}</span>
          </div>
        );
      }
      
      // Match bullet points
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={idx} className="bullet-item">
            {line}
          </div>
        );
      }
      
      // Regular paragraph
      return (
        <p key={idx} className="text-line">
          {line}
        </p>
      );
    });
  };
  
  return (
  <div
    className={`p-3 rounded shadow-sm ${
      isUser
        ? 'bg-primary text-white'
        : 'bg-white border'
    } ${className}`}
    style={{ maxWidth: '75%', ...style }}
  >
    {typeof text === 'string' ? formatText(text) : text}
  </div>
);
}

export default MessageBubble;
