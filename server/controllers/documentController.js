import Case from '../models/Case.js';
import { getCaseRole } from '../middleware/casePermission.js';

export const uploadDocument = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const caseData = req.caseData || await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const caseRole = getCaseRole(userId, req.user.role, caseData);
    if (!['lawyer', 'paralegal', 'client'].includes(caseRole)) {
      return res.status(403).json({ error: 'Not authorized to upload documents' });
    }

    const document = {
      id: Date.now().toString(),
      name: req.file.originalname,
      type: req.file.mimetype,
      status: 'draft',
      url: `/uploads/${req.file.filename}`,
      uploadedAt: new Date(),
      uploadedBy: userId
    };

    caseData.documents.push(document);

    if (req.user.role === 'paralegal' && caseData.status === 'drafting') {
      caseData.notifications = caseData.notifications || [];
      caseData.notifications.unshift({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        message: 'A paralegal uploaded a document for drafting. Review the upload and, when ready, move the case to the next phase.',
        type: 'document',
        recipientRoles: ['lawyer'],
        recipientIds: [],
        seenBy: [],
        createdAt: new Date()
      });
    }

    await caseData.save();

    res.json({
      success: true,
      document,
      case: caseData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { caseId, documentId } = req.params;

    const caseData = req.caseData || await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const documentIndex = caseData.documents.findIndex(d => d.id === documentId);
    if (documentIndex === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }

    caseData.documents.splice(documentIndex, 1);
    await caseData.save();

    res.json({
      success: true,
      case: caseData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDocuments = async (req, res) => {
  try {
    const caseData = req.caseData || await Case.findById(req.params.caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json({
      success: true,
      documents: caseData.documents
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateDocumentStatus = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { newStatus } = req.body;
    const userId = req.user.id;

    if (!['draft', 'review', 'approved'].includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid document status' });
    }

    const caseData = req.caseData || await Case.findById(req.params.caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const caseRole = getCaseRole(userId, req.user.role, caseData);
    const document = caseData.documents.find(d => d.id === documentId);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (newStatus === 'review') {
      if (!['lawyer', 'paralegal'].includes(caseRole)) {
        return res.status(403).json({ error: 'Only legal team members can mark documents for review' });
      }
      document.status = 'review';
      document.reviewedBy = userId;
      document.reviewedAt = new Date();
    }

    if (newStatus === 'approved') {
      if (caseRole !== 'lawyer') {
        return res.status(403).json({ error: 'Only lawyers can approve documents' });
      }
      document.status = 'approved';
      document.approvedBy = userId;
      document.approvedAt = new Date();
    }

    if (newStatus === 'draft' && ['lawyer', 'paralegal'].includes(caseRole)) {
      document.status = 'draft';
    }

    await caseData.save();

    res.json({
      success: true,
      document,
      case: caseData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
