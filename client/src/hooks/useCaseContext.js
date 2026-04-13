import { useContext } from 'react';
import { CaseContext } from '../context/CaseContext';

export function useCaseContext() {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error('useCaseContext must be used within CaseProvider');
  }
  return context;
}
