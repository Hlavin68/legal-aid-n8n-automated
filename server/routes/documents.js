import express from 'express';
import {
  uploadDocument,
  deleteDocument,
  getDocuments
} from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

// Upload document
router.post('/:caseId/upload', upload.single('file'), uploadDocument);

// Get documents for a case
router.get('/:caseId', getDocuments);

// Delete document
router.delete('/:caseId/:documentId', deleteDocument);

export default router;
