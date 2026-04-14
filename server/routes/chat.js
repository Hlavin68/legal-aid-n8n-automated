import express from 'express';
import {
  sendMessage,
  startNewSession,
  getAllSessions,
  getSessionHistory,
  deleteSession,
  deleteMessage,
  toggleArchiveSession,
  updateSession
} from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Message sending (saves to history automatically if sessionId provided)
router.post('/send', authenticate, sendMessage);

// Session management
router.post('/sessions/new', authenticate, startNewSession);
router.get('/sessions', authenticate, getAllSessions);
router.get('/sessions/:sessionId', authenticate, getSessionHistory);
router.put('/sessions/:sessionId', authenticate, updateSession);
router.delete('/sessions/:sessionId', authenticate, deleteSession);
router.put('/sessions/:sessionId/toggle-archive', authenticate, toggleArchiveSession);

// Message management within sessions
router.delete('/sessions/:sessionId/messages/:messageId', authenticate, deleteMessage);

export default router;
