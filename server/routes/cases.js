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
  publishToCaseBase,
  createTask,
  updateTaskStatus
} from '../controllers/caseController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  loadCase,
  requireCaseMembership,
  requireCaseCreatorOrAdmin
} from '../middleware/casePermission.js';

const router = express.Router();

// All case routes require authentication
router.use(authenticate);

// Get all cases for current user
router.get('/', getMyCases);

// Case base (published/completed cases) - available to all
router.get('/base/list', getCaseBase);
router.get('/base/:caseId', getCaseBaseById);

// Get single case with audit trail
router.get('/:caseId', loadCase, requireCaseMembership(), getCaseById);

// Get case history/audit trail
router.get('/:caseId/history', loadCase, requireCaseMembership(), getCaseHistory);

// Get available status transitions for this user
router.get('/:caseId/transitions', loadCase, requireCaseMembership(), getAvailableTransitions);

// Create case (lawyers and paralegals only - they create for clients)
router.post('/', authorize(['lawyer', 'paralegal']), createCase);

// Update case details (not status)
router.put('/:caseId', updateCase);

// Change case status with lifecycle validation
router.put('/:caseId/status', authorize(['lawyer']), loadCase, requireCaseMembership(), changeStatus);

// Assign user to case (creator only or admin)
router.post('/:caseId/assign', authorize(['lawyer', 'admin']), loadCase, requireCaseCreatorOrAdmin, assignUser);

// Remove user from case (creator only or admin)
router.delete('/:caseId/users/:userId', authorize(['lawyer', 'admin']), loadCase, requireCaseCreatorOrAdmin, removeUser);

// Delete case (lawyers and paralegals only - creator only)
router.delete('/:caseId', authorize(['lawyer', 'paralegal']), deleteCase);

// Notes
router.post('/:caseId/notes', loadCase, requireCaseMembership(), addNote);
router.delete('/:caseId/notes/:noteId', loadCase, requireCaseMembership(), deleteNote);

// Deadlines
router.post('/:caseId/deadlines', authorize(['lawyer', 'paralegal']), loadCase, requireCaseMembership(), addDeadline);
router.delete('/:caseId/deadlines/:deadlineId', authorize(['lawyer', 'paralegal']), loadCase, requireCaseMembership(), deleteDeadline);

// Publish to case base (lawyers and paralegals only)
router.post('/:caseId/publish', authorize(['lawyer', 'paralegal']), loadCase, requireCaseMembership(), publishToCaseBase);

// Tasks
router.post('/:caseId/tasks', authorize(['lawyer']), loadCase, requireCaseMembership(), createTask);
router.put('/:caseId/tasks/:taskId/status', authorize(['paralegal']), loadCase, requireCaseMembership(), updateTaskStatus);

export default router;
