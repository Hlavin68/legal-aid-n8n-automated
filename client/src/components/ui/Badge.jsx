import React from 'react';

export function Badge({ text, variant = 'default', className = '' }) {
  const variantMap = {
    default: 'bg-secondary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    primary: 'bg-primary'
  };
  
  return (
    <span className={`badge ${variantMap[variant] || 'bg-secondary'} ${className}`}>
      {text}
    </span>
  );
}

export default Badge;
