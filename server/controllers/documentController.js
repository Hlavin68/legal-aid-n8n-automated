import Case from '../models/Case.js';

export const uploadDocument = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Authorization check
    if (
      caseData.clientId.toString() !== userId &&
      caseData.lawyerId?.toString() !== userId
    ) {
      return res.status(403).json({ error: 'Not authorized to upload documents' });
    }

    const document = {
      id: Date.now().toString(),
      name: req.file.originalname,
      type: req.file.mimetype,
      url: `/uploads/${req.file.filename}`,
      uploadedAt: new Date(),
      uploadedBy: userId
    };

    caseData.documents.push(document);
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

    const caseData = await Case.findById(caseId);
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
    const { caseId } = req.params;

    const caseData = await Case.findById(caseId);
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
