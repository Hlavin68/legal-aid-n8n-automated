import React, { createContext, useState, useCallback } from 'react';
import { caseAPI, handleAPIError } from '../services/api';

export const CaseContext = createContext();

export function CaseProvider({ children }) {
  const [cases, setCases] = useState([]);
  const [currentCaseId, setCurrentCaseId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Don't fetch on mount - let Dashboard handle it after auth is verified
  // This prevents 401 errors on app load when user isn't authenticated yet

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await caseAPI.getMyCases();
      if (response.data?.success) {
        setCases(response.data.cases || []);
      }
    } catch (err) {
      // Silently skip 401 errors (user not authenticated yet)
      if (err.response?.status === 401) {
        return;
      }
      const apiErr = handleAPIError(err);
      setError(apiErr.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCurrentCase = useCallback(() => {
    return cases.find(c => c._id === currentCaseId) || cases.find(c => c.id === currentCaseId);
  }, [cases, currentCaseId]);

  const createCase = useCallback(async ({ title, category, description, clientEmail }) => {
    try {
      const response = await caseAPI.createCase({
        title,
        category,
        description,
        clientEmail
      });
      
      if (response.data?.success) {
        const newCase = response.data.case;
        setCases(prev => [newCase, ...prev]);
        setCurrentCaseId(newCase._id);
        return newCase;
      }
    } catch (err) {
      const apiErr = handleAPIError(err);
      console.error('Error creating case:', apiErr);
      throw err;
    }
  }, []);

  const updateCase = useCallback(async (caseId, updates) => {
    try {
      const response = await caseAPI.updateCase(caseId, updates);
      if (response.data?.success) {
        setCases(prev => prev.map(c => 
          (c._id === caseId || c.id === caseId) ? response.data.case : c
        ));
      }
    } catch (err) {
      console.error('Error updating case:', handleAPIError(err));
      throw err;
    }
  }, []);

  const changeStatus = useCallback(async (caseId, newStatus) => {
    try {
      const response = await caseAPI.changeStatus(caseId, newStatus);
      if (response.data?.success) {
        setCases(prev => prev.map(c => 
          (c._id === caseId || c.id === caseId) ? response.data.case : c
        ));
      }
    } catch (err) {
      const apiErr = handleAPIError(err);
      console.error('Error changing case status:', apiErr);
      throw err;
    }
  }, []);

  const addNote = useCallback(async (caseId, content) => {
    try {
      const response = await caseAPI.addNote(caseId, content);
      if (response.data?.success) {
        setCases(prev => prev.map(c => 
          (c._id === caseId || c.id === caseId) ? response.data.case : c
        ));
      }
    } catch (err) {
      console.error('Error adding note:', handleAPIError(err));
      throw err;
    }
  }, []);

  const deleteNote = useCallback(async (caseId, noteId) => {
    try {
      const response = await caseAPI.deleteNote(caseId, noteId);
      if (response.data?.success) {
        setCases(prev => prev.map(c => 
          (c._id === caseId || c.id === caseId) ? response.data.case : c
        ));
      }
    } catch (err) {
      console.error('Error deleting note:', handleAPIError(err));
      throw err;
    }
  }, []);

  const addDocument = useCallback(async (caseId, fileName, fileType) => {
    try {
      const response = await caseAPI.updateCase(caseId, {
        documents: { name: fileName, type: fileType }
      });
      if (response.data?.success) {
        setCases(prev => prev.map(c => 
          (c._id === caseId || c.id === caseId) ? response.data.case : c
        ));
      }
    } catch (err) {
      console.error('Error adding document:', handleAPIError(err));
      throw err;
    }
  }, []);

  const deleteDocument = useCallback(async (caseId, docId) => {
    try {
      setCases(prev => prev.map(c => {
        if (c._id === caseId || c.id === caseId) {
          return {
            ...c,
            documents: c.documents.filter(d => d._id !== docId && d.id !== docId)
          };
        }
        return c;
      }));
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  }, []);

  const addDeadline = useCallback(async (caseId, title, date) => {
    try {
      const response = await caseAPI.addDeadline(caseId, { title, date });
      if (response.data?.success) {
        setCases(prev => prev.map(c => 
          (c._id === caseId || c.id === caseId) ? response.data.case : c
        ));
      }
    } catch (err) {
      console.error('Error adding deadline:', handleAPIError(err));
      throw err;
    }
  }, []);

  const deleteDeadline = useCallback(async (caseId, deadlineId) => {
    try {
      const response = await caseAPI.deleteDeadline(caseId, deadlineId);
      if (response.data?.success) {
        setCases(prev => prev.map(c => 
          (c._id === caseId || c.id === caseId) ? response.data.case : c
        ));
      }
    } catch (err) {
      console.error('Error deleting deadline:', handleAPIError(err));
      throw err;
    }
  }, []);

  const updateCaseSummary = useCallback(async (caseId, summary) => {
    try {
      const response = await caseAPI.updateCase(caseId, { summary });
      if (response.data?.success) {
        setCases(prev => prev.map(c => 
          (c._id === caseId || c.id === caseId) ? response.data.case : c
        ));
      }
    } catch (err) {
      console.error('Error updating case summary:', handleAPIError(err));
      throw err;
    }
  }, []);

  const value = {
    cases,
    currentCaseId,
    setCurrentCaseId,
    getCurrentCase,
    createCase,
    updateCase,
    changeStatus,
    addNote,
    deleteNote,
    addDocument,
    deleteDocument,
    addDeadline,
    deleteDeadline,
    updateCaseSummary,
    fetchCases,
    loading,
    error
  };

  return (
    <CaseContext.Provider value={value}>
      {children}
    </CaseContext.Provider>
  );
}
