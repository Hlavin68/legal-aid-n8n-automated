import React from 'react';

export function Card({ children, className = '', onClick = null, interactive = false }) {
  return (
    <div 
      className={`card ${interactive ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      role={interactive ? 'button' : 'article'}
      tabIndex={interactive ? 0 : -1}
      style={interactive ? { cursor: 'pointer' } : {}}
    >
      {children}
    </div>
  );
}

export default Card;
