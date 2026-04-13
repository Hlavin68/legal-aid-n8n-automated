import React from 'react';

export function TextInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  error = null,
  multiline = false,
  rows = 3,
  className = ''
}) {
  return (
    <div className="mb-3">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-danger">*</span>}
        </label>
      )}
      {multiline ? (
        <textarea
          className={`form-control ${error ? 'is-invalid' : ''} ${className}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <input
          type={type}
          className={`form-control ${error ? 'is-invalid' : ''} ${className}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
}

export default TextInput;
