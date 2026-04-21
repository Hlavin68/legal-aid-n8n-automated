import express from 'express';
import {
  getAllCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  getMyCases,
  getCategories
} from '../controllers/caseBaseController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { pdfUpload } from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Public routes (available to all authenticated users - client, lawyer, paralegal)
 */

// Get all published cases with search/filter
router.get('/list', getAllCases);

// Get case categories
router.get('/categories', getCategories);

// Get single case details
router.get('/lawyer/my-cases', authorize(['lawyer']), getMyCases);
router.get('/categories', getCategories);
router.get('/list', getAllCases);
router.get('/:caseId', getCaseById);

// Create new case (requires PDF upload)
router.post('/create', authorize(['lawyer']), pdfUpload.single('pdf'), createCase);

// Update case details
router.put('/:caseId', authorize(['lawyer']), updateCase);

// Delete case
router.delete('/:caseId', authorize(['lawyer']), deleteCase);

export default router;
