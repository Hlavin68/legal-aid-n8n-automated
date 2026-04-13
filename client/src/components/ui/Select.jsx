import React from 'react';

export function Select({
  label,
  value,
  onChange,
  options = [],
  required = false,
  error = null,
  placeholder = 'Select option',
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
      <select
        className={`form-select ${error ? 'is-invalid' : ''} ${className}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => {
          const optValue = typeof opt === 'object' ? opt.value : opt;
          const optLabel = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={optValue} value={optValue}>
              {optLabel}
            </option>
          );
        })}
      </select>
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
}

export default Select;
