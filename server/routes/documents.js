import express from 'express';
import {
  uploadDocument,
  deleteDocument,
  getDocuments,
  updateDocumentStatus
} from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { loadCase, requireCaseMembership } from '../middleware/casePermission.js';

const router = express.Router();

router.use(authenticate);

// Upload document
router.post('/:caseId/upload', loadCase, requireCaseMembership(), upload.single('file'), uploadDocument);

// Get documents for a case
router.get('/:caseId', loadCase, requireCaseMembership(), getDocuments);

// Update document status
router.put('/:caseId/:documentId/status', loadCase, requireCaseMembership(), updateDocumentStatus);

// Delete document
router.delete('/:caseId/:documentId', loadCase, requireCaseMembership(), deleteDocument);

export default router;
