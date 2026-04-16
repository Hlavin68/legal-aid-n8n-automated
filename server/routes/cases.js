import express from 'express';
import {
  getMyCases,
  getCaseById,
  createCase,
  updateCase,
  changeStatus,
  getAvailableTransitions,
  deleteCase,
  assignUser,
  removeUser,
  addNote,
  deleteNote,
  addDeadline,
  deleteDeadline,
  getCaseBase,
  getCaseBaseById,
  getCaseHistory,
  publishToCaseBase
} from '../controllers/caseController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All case routes require authentication
router.use(authenticate);

// Get all cases for current user
router.get('/', getMyCases);

// Case base (published/completed cases) - available to all
router.get('/base/list', getCaseBase);
router.get('/base/:caseId', getCaseBaseById);

// Get single case with audit trail
router.get('/:caseId', getCaseById);

// Get case history/audit trail
router.get('/:caseId/history', getCaseHistory);

// Get available status transitions for this user
router.get('/:caseId/transitions', getAvailableTransitions);

// Create case (lawyers and paralegals only - they create for clients)
router.post('/', authorize(['lawyer', 'paralegal']), createCase);

// Update case details (not status)
router.put('/:caseId', updateCase);

// Change case status with lifecycle validation
router.put('/:caseId/status', authorize(['lawyer', 'paralegal']), changeStatus);

// Assign user to case (creator only)
router.post('/:caseId/assign', authorize(['lawyer', 'paralegal']), assignUser);

// Remove user from case (creator only)
router.delete('/:caseId/users/:userId', authorize(['lawyer', 'paralegal']), removeUser);

// Delete case (lawyers and paralegals only - creator only)
router.delete('/:caseId', authorize(['lawyer', 'paralegal']), deleteCase);

// Notes
router.post('/:caseId/notes', addNote);
router.delete('/:caseId/notes/:noteId', deleteNote);

// Deadlines
router.post('/:caseId/deadlines', addDeadline);
router.delete('/:caseId/deadlines/:deadlineId', deleteDeadline);

// Publish to case base (lawyers and paralegals only)
router.post('/:caseId/publish', authorize(['lawyer', 'paralegal']), publishToCaseBase);

export default router;
