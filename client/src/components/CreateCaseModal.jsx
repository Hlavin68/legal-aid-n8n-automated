import React, { useState, useEffect } from 'react';
import { Modal, TextInput, Select, Button } from './ui';
import { categoryOptions } from '../context/mockData';
import { useAuth } from '../hooks/useAuth';

export function CreateCaseModal({ isOpen, onClose, onCreateCase }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    clientEmail: ''
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Fetch clients when modal opens
  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      // TODO: Add endpoint to backend to fetch all clients
      // For now, users need to know the client ID
      // const response = await apiClient.get('/users?role=client');
      // if (response.data?.success) {
      //   setClients(response.data.users);
      // }
      setClients([]); // Placeholder
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
    if (apiError) {
      setApiError(null);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title || !String(formData.title).trim()) {
      errors.title = 'Case title is required';
    }
    if (!formData.category) {
      errors.category = 'Category is required';
    }
    if (!formData.description || !String(formData.description).trim()) {
      errors.description = 'Description is required';
    }
    if (!formData.clientEmail || !String(formData.clientEmail).trim()) {
      errors.clientEmail = 'Client email is required';
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.clientEmail.trim())) {
        errors.clientEmail = 'Please enter a valid email address';
      }
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const caseData = {
        title: String(formData.title).trim(),
        category: formData.category,
        description: String(formData.description).trim(),
        clientEmail: String(formData.clientEmail).trim()
      };

      await onCreateCase(caseData);
      
      // Reset form
      setFormData({ title: '', category: '', description: '', clientEmail: '' });
      setValidationErrors({});
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create case';
      setApiError(errorMessage);
      console.error('Error creating case:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only show modal to lawyers and paralegals
  if (!user || (user.role !== 'lawyer' && user.role !== 'paralegal')) {
    return null;
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Case" size="md">
      <form onSubmit={handleSubmit} className="create-case-form">
        {apiError && (
          <div className="api-error-message">
           Error: {apiError}
          </div>
        )}

        <TextInput
          label="Case Title"
          value={formData.title}
          onChange={(value) => handleInputChange('title', value)}
          placeholder="e.g., Land Dispute Resolution"
          required
          error={validationErrors.title}
        />

        <Select
          label="Category"
          value={formData.category}
          onChange={(value) => handleInputChange('category', value)}
          options={categoryOptions}
          required
          error={validationErrors.category}
        />

        <TextInput
          label="Description"
          value={formData.description}
          onChange={(value) => handleInputChange('description', value)}
          placeholder="Describe your case in detail..."
          required
          multiline
          rows={4}
          error={validationErrors.description}
        />

        {clients.length > 0 ? (
          <Select
            label="Select Client"
            value={formData.clientEmail}
            onChange={(value) => handleInputChange('clientEmail', value)}
            options={clients.map(c => ({ value: c.email, label: `${c.name} (${c.email})` }))}
            required
            error={validationErrors.clientEmail}
            disabled={loadingClients}
          />
        ) : (
          <div>
            <label>Client Email</label>
            <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '8px' }}>
              👉 Enter the client's email address
            </div>
            <TextInput
              value={formData.clientEmail}
              onChange={(value) => handleInputChange('clientEmail', value)}
              placeholder="e.g., client@example.com"
              required
              error={validationErrors.clientEmail}
            />
          </div>
        )}

        <div className="form-actions">
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Case'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateCaseModal;
