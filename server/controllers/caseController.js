import Case from '../models/Case.js';
import CaseHistory from '../models/CaseHistory.js';
import User from '../models/User.js';
import { isValidTransition, isValidTransitionForRole, CASE_STATUSES, getStatusLabel, getStateDescription } from '../utils/caseStateTransitions.js';

/**
 * Log a case action to the audit trail
 * @private
 */
const logCaseAction = async (caseId, action, performedBy, details = null, metadata = {}) => {
  try {
    const caseRecord = await Case.findById(caseId);
    const history = new CaseHistory({
      caseId,
      action,
      previousStatus: metadata.previousStatus || null,
      newStatus: metadata.newStatus || null,
      performedBy,
      details,
      metadata
    });
    await history.save();
  } catch (error) {
    console.error('Failed to log case action:', error.message);
  }
};

/**
 * Get all cases for the current user
 * - Clients: See cases where they are the client
 * - Lawyers/Paralegals: See cases they created or are assigned to
 */
export const getMyCases = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = {};

    if (userRole === 'client') {
      query.clientId = userId;
    } else if (userRole === 'lawyer' || userRole === 'paralegal') {
      query.$or = [
        { caseCreatedBy: userId },
        { 'assignedUsers.userId': userId }
      ];
    }

    const cases = await Case.find(query)
      .populate('clientId', 'name email')
      .populate('caseCreatedBy', 'name email firm licenseNumber')
      .populate('statusChangedBy', 'name email')
      .populate('assignedUsers.userId', 'name email firm')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      cases
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get case by ID with audit trail
 */
export const getCaseById = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const caseData = await Case.findById(caseId)
      .populate('clientId', 'name email')
      .populate('lawyerId', 'name email firm licenseNumber')
      .populate('caseCreatedBy', 'name email firm licenseNumber')
      .populate('statusChangedBy', 'name email')
      .populate('assignedUsers.userId', 'name email firm')
      .populate('notes.author', 'name email');

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check authorization
    if (userRole === 'client') {
      if (caseData.clientId._id.toString() !== userId) {
        return res.status(403).json({ error: 'Not authorized to view this case' });
      }
    } else if (userRole === 'lawyer' || userRole === 'paralegal') {
      const isCreator = caseData.caseCreatedBy._id.toString() === userId;
      const isAssigned = caseData.assignedUsers.some(u => u.userId._id.toString() === userId);
      if (!isCreator && !isAssigned) {
        return res.status(403).json({ error: 'Not authorized to view this case' });
      }
    }

    // Get audit trail
    const history = await CaseHistory.find({ caseId })
      .populate('performedBy', 'name email role')
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      case: caseData,
      history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a new case (starts in 'new' state)
 */
export const createCase = async (req, res) => {
  try {
    const { title, category, description, clientEmail, lawyerEmail } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only lawyers and paralegals can create cases
    if (userRole !== 'lawyer' && userRole !== 'paralegal') {
      return res.status(403).json({
        error: 'Only lawyers and paralegals can create cases'
      });
    }

    // Validate required fields
    if (!title || !category || !description || !clientEmail) {
      return res.status(400).json({
        error: 'Title, category, description, and client email are required'
      });
    }

    // Verify client exists and is actually a client
    const client = await User.findOne({ email: clientEmail.toLowerCase() });
    if (!client || client.role !== 'client') {
      return res.status(400).json({
        error: 'Invalid client email or client does not exist'
      });
    }

    // Verify lawyer if provided
    let lawyerId = null;
    if (lawyerEmail) {
      const lawyer = await User.findOne({ email: lawyerEmail.toLowerCase() });
      if (!lawyer || lawyer.role !== 'lawyer') {
        return res.status(400).json({
          error: 'Invalid lawyer email or lawyer does not exist'
        });
      }
      lawyerId = lawyer._id;
    }

    // Create case in 'new' state
    const newCase = new Case({
      title,
      category,
      description,
      clientId: client._id,
      lawyerId,
      caseCreatedBy: userId,
      status: CASE_STATUSES.NEW,
      statusChangedBy: userId,
      statusChangedAt: new Date(),
      assignedUsers: [{
        userId,
        role: userRole
      }]
    });

    await newCase.save();

    // Log creation
    await logCaseAction(newCase._id, 'created', userId, 'Case created', {
      newStatus: CASE_STATUSES.NEW
    });

    await newCase.populate('clientId', 'name email');
    await newCase.populate('caseCreatedBy', 'name email firm licenseNumber');
    await newCase.populate('lawyerId', 'name email firm licenseNumber');
    await newCase.populate('statusChangedBy', 'name email');
    await newCase.populate('assignedUsers.userId', 'name email firm');

    res.status(201).json({
      success: true,
      message: 'Case created successfully in NEW state',
      case: newCase
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update case details (NOT status)
 */
export const updateCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const updates = req.body;

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Authorization check
    if (userRole === 'client') {
      if (caseData.clientId.toString() !== userId) {
        return res.status(403).json({ error: 'Not authorized to update this case' });
      }
      // Clients cannot update these fields
      const restrictedFields = ['status', 'clientId', 'caseCreatedBy', 'assignedUsers', 'category'];
      const hasRestricted = restrictedFields.some(field => field in updates);
      if (hasRestricted) {
        return res.status(403).json({ 
          error: 'Clients can only update certain fields' 
        });
      }
    } else if (userRole === 'lawyer' || userRole === 'paralegal') {
      const isCreator = caseData.caseCreatedBy.toString() === userId;
      const isAssigned = caseData.assignedUsers.some(u => u.userId.toString() === userId);
      if (!isCreator && !isAssigned) {
        return res.status(403).json({ error: 'Not authorized to update this case' });
      }
      // Status should be updated using the changeStatus endpoint
      if ('status' in updates) {
        return res.status(400).json({ 
          error: 'Use the changeStatus endpoint to change case status' 
        });
      }
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (key !== 'status' && key !== '_id') {
        caseData[key] = updates[key];
      }
    });

    await caseData.save();

    const updatedCase = await Case.findById(caseId)
      .populate('clientId', 'name email')
      .populate('lawyerId', 'name email firm licenseNumber')
      .populate('caseCreatedBy', 'name email firm')
      .populate('statusChangedBy', 'name email')
      .populate('assignedUsers.userId', 'name email firm');

    res.json({
      success: true,
      message: 'Case updated successfully',
      case: updatedCase
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Transition case to next status
 * Enforces valid state transitions: new → drafting → filed → hearing → judgment → closed
 */
export const changeStatus = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { newStatus, reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only lawyers and paralegals can change status
    if (userRole !== 'lawyer' && userRole !== 'paralegal') {
      return res.status(403).json({
        error: 'Only lawyers and paralegals can change case status'
      });
    }

    if (!newStatus) {
      return res.status(400).json({ error: 'New status is required' });
    }

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check authorization
    const isCreator = caseData.caseCreatedBy.toString() === userId;
    const isAssigned = caseData.assignedUsers.some(u => u.userId.toString() === userId);
    if (!isCreator && !isAssigned) {
      return res.status(403).json({ error: 'Not authorized to change case status' });
    }

    // Validate status transition with role checking
    const validationResult = isValidTransitionForRole(caseData.status, newStatus, userRole);
    if (!validationResult.valid) {
      return res.status(400).json({
        error: validationResult.error,
        reason: validationResult.reason,
        currentStatus: caseData.status,
        requestedStatus: newStatus,
        statusLabel: validationResult.statusLabel
      });
    }

    // Update status
    const previousStatus = caseData.status;
    caseData.status = newStatus;
    caseData.statusChangedAt = new Date();
    caseData.statusChangedBy = userId;
    await caseData.save();

    // Log status change
    await logCaseAction(
      caseId,
      'status_changed',
      userId,
      reason || `Status changed from ${previousStatus} to ${newStatus}`,
      {
        previousStatus,
        newStatus
      }
    );

    const updatedCase = await Case.findById(caseId)
      .populate('clientId', 'name email')
      .populate('lawyerId', 'name email firm licenseNumber')
      .populate('caseCreatedBy', 'name email firm')
      .populate('statusChangedBy', 'name email')
      .populate('assignedUsers.userId', 'name email firm');

    res.json({
      success: true,
      message: `Case status changed from '${getStatusLabel(previousStatus)}' to '${getStatusLabel(newStatus)}'`,
      case: updatedCase,
      stateDescription: getStateDescription(newStatus)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get available status transitions for the current user
 */
export const getAvailableTransitions = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check authorization
    if (userRole === 'client') {
      if (caseData.clientId.toString() !== userId) {
        return res.status(403).json({ error: 'Not authorized to view this case' });
      }
      // Clients can't transition
      return res.json({
        success: true,
        currentStatus: caseData.status,
        availableTransitions: []
      });
    }

    if (userRole !== 'lawyer' && userRole !== 'paralegal') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get valid transitions for this role
    const transitions = {};
    const possibleStates = Object.values(CASE_STATUSES);
    
    for (const nextStatus of possibleStates) {
      const validation = isValidTransitionForRole(caseData.status, nextStatus, userRole);
      if (validation.valid) {
        transitions[nextStatus] = {
          label: getStatusLabel(nextStatus),
          description: getStateDescription(nextStatus)
        };
      }
    }

    res.json({
      success: true,
      currentStatus: {
        value: caseData.status,
        label: getStatusLabel(caseData.status),
        description: getStateDescription(caseData.status)
      },
      availableTransitions: transitions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Add note to case
 */
export const addNote = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!content) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check authorization
    // Clients can only add notes to their own cases
    // Lawyers/paralegals can add notes to cases they created or are assigned to
    if (userRole === 'client') {
      if (caseData.clientId.toString() !== userId) {
        return res.status(403).json({ error: 'Clients can only add comments to their own cases' });
      }
    } else if (['lawyer', 'paralegal'].includes(userRole)) {
      const isCreator = caseData.caseCreatedBy.toString() === userId;
      const isAssigned = caseData.assignedUsers.some(u => u.userId.toString() === userId);
      if (!isCreator && !isAssigned) {
        return res.status(403).json({ error: 'Not authorized to add notes to this case' });
      }
    } else {
      return res.status(403).json({ error: 'Only clients and legal professionals can add notes' });
    }

    caseData.notes.push({
      id: Date.now().toString(),
      content,
      author: userId,
      timestamp: new Date()
    });

    await caseData.save();

    // Log note addition
    await logCaseAction(caseId, 'note_added', userId, `Note added: "${content.substring(0, 50)}..."`);

    const updatedCase = await Case.findById(caseId).populate('notes.author', 'name email');

    res.json({
      success: true,
      message: 'Note added successfully',
      case: updatedCase
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get case audit trail
 */
export const getCaseHistory = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check authorization
    if (userRole === 'client' && caseData.clientId.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if ((userRole === 'lawyer' || userRole === 'paralegal')) {
      const isCreator = caseData.caseCreatedBy.toString() === userId;
      const isAssigned = caseData.assignedUsers.some(u => u.userId.toString() === userId);
      if (!isCreator && !isAssigned) {
        return res.status(403).json({ error: 'Not authorized' });
      }
    }

    const history = await CaseHistory.find({ caseId })
      .populate('performedBy', 'name email role')
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete case (only creator can delete)
 */
export const deleteCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only lawyers and paralegals can delete cases
    if (userRole !== 'lawyer' && userRole !== 'paralegal') {
      return res.status(403).json({ error: 'Only lawyers and paralegals can delete cases' });
    }

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Only the creator can delete
    if (caseData.caseCreatedBy.toString() !== userId) {
      return res.status(403).json({ error: 'Only the case creator can delete it' });
    }

    await Case.findByIdAndDelete(caseId);
    await CaseHistory.deleteMany({ caseId });

    res.json({
      success: true,
      message: 'Case deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete note from case
 */
export const deleteNote = async (req, res) => {
  try {
    const { caseId, noteId } = req.params;
    const userId = req.user.id;

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check authorization
    const note = caseData.notes.find(n => n.id === noteId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Only the note author or lawyers/paralegals can delete
    if (note.author.toString() !== userId && req.user.role !== 'lawyer' && req.user.role !== 'paralegal') {
      return res.status(403).json({ error: 'Not authorized to delete this note' });
    }

    caseData.notes = caseData.notes.filter(n => n.id !== noteId);
    await caseData.save();

    // Log note deletion
    await logCaseAction(caseId, 'note_removed', userId, `Note deleted`);

    const updatedCase = await Case.findById(caseId).populate('notes.author', 'name email');

    res.json({
      success: true,
      message: 'Note deleted successfully',
      case: updatedCase
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Add deadline to case
 */
export const addDeadline = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { title, date } = req.body;
    const userId = req.user.id;

    if (!title || !date) {
      return res.status(400).json({
        error: 'Title and date are required'
      });
    }

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check authorization
    if (req.user.role !== 'lawyer' && req.user.role !== 'paralegal') {
      return res.status(403).json({ error: 'Only lawyers and paralegals can add deadlines' });
    }

    caseData.deadlines.push({
      id: Date.now().toString(),
      title,
      date: new Date(date)
    });

    await caseData.save();

    // Log deadline addition
    await logCaseAction(caseId, 'deadline_set', userId, `Deadline set: ${title} on ${date}`);

    res.json({
      success: true,
      message: 'Deadline added successfully',
      case: caseData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete deadline from case
 */
export const deleteDeadline = async (req, res) => {
  try {
    const { caseId, deadlineId } = req.params;
    const userId = req.user.id;

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check authorization
    if (req.user.role !== 'lawyer' && req.user.role !== 'paralegal') {
      return res.status(403).json({ error: 'Only lawyers and paralegals can delete deadlines' });
    }

    const deadline = caseData.deadlines.find(d => d.id === deadlineId);
    if (!deadline) {
      return res.status(404).json({ error: 'Deadline not found' });
    }

    caseData.deadlines = caseData.deadlines.filter(d => d.id !== deadlineId);
    await caseData.save();

    // Log deadline deletion
    await logCaseAction(caseId, 'deadline_removed', userId, `Deadline removed: ${deadline.title}`);

    res.json({
      success: true,
      message: 'Deadline deleted successfully',
      case: caseData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get case base (published/completed cases)
 */
export const getCaseBase = async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = { caseBase: true, status: CASE_STATUSES.CLOSED };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const cases = await Case.find(query)
      .populate('clientId', 'name')
      .populate('lawyerId', 'name firm')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      cases
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Publish a case to case base
 * Authorization: Lawyers/Paralegals who created or are assigned to the case
 * Only closed cases can be published
 */
export const publishToCaseBase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only lawyers and paralegals can publish
    if (userRole !== 'lawyer' && userRole !== 'paralegal') {
      return res.status(403).json({ error: 'Only lawyers and paralegals can publish cases' });
    }

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check authorization
    const isCreator = caseData.caseCreatedBy.toString() === userId;
    const isAssigned = caseData.assignedUsers.some(u => u.userId.toString() === userId);
    if (!isCreator && !isAssigned) {
      return res.status(403).json({ error: 'Not authorized to publish this case' });
    }

    if (caseData.status !== CASE_STATUSES.CLOSED) {
      return res.status(400).json({ error: 'Only closed cases can be published to case base' });
    }

    caseData.caseBase = true;
    await caseData.save();

    res.json({
      success: true,
      message: 'Case published to case base successfully',
      case: caseData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Assign a lawyer/paralegal to a case
 * Authorization: Case creator only
 */
export const assignUser = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { userId : assignUserId, userRole: assignUserRole } = req.body;
    const requesterId = req.user.id;

    if (!assignUserId || !assignUserRole) {
      return res.status(400).json({ error: 'userId and userRole are required' });
    }

    if (!['lawyer', 'paralegal'].includes(assignUserRole)) {
      return res.status(400).json({ error: 'userRole must be lawyer or paralegal' });
    }

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Only creator can assign users
    if (caseData.caseCreatedBy.toString() !== requesterId) {
      return res.status(403).json({ error: 'Only the case creator can assign users' });
    }

    // Verify user exists and has correct role
    const user = await User.findById(assignUserId);
    if (!user || !['lawyer', 'paralegal'].includes(user.role)) {
      return res.status(400).json({ error: 'Invalid user ID or user is not a lawyer/paralegal' });
    }

    // Check if already assigned
    const alreadyAssigned = caseData.assignedUsers.some(u => u.userId.toString() === assignUserId);
    if (alreadyAssigned) {
      return res.status(400).json({ error: 'User is already assigned to this case' });
    }

    // Add user to assignedUsers
    caseData.assignedUsers.push({
      userId: assignUserId,
      role: user.role
    });

    await caseData.save();

    // Log user assignment
    await logCaseAction(caseId, 'assigned_user', requesterId, `${user.name} assigned to case`);

    const updatedCase = await Case.findById(caseId)
      .populate('clientId', 'name email')
      .populate('caseCreatedBy', 'name email firm')
      .populate('assignedUsers.userId', 'name email firm');

    res.json({
      success: true,
      message: `${user.name} assigned to case`,
      case: updatedCase
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Remove a lawyer/paralegal from a case
 * Authorization: Case creator only
 */
export const removeUser = async (req, res) => {
  try {
    const { caseId, userId } = req.params;
    const requesterId = req.user.id;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Only creator can remove users
    if (caseData.caseCreatedBy.toString() !== requesterId) {
      return res.status(403).json({ error: 'Only the case creator can remove users' });
    }

    // Cannot remove creator
    if (caseData.caseCreatedBy.toString() === userId) {
      return res.status(400).json({ error: 'Cannot remove the case creator' });
    }

    // Find the user being removed
    const removedUser = await User.findById(userId);

    // Remove user from assignedUsers
    const initialLength = caseData.assignedUsers.length;
    caseData.assignedUsers = caseData.assignedUsers.filter(
      u => u.userId.toString() !== userId
    );

    if (caseData.assignedUsers.length === initialLength) {
      return res.status(404).json({ error: 'User is not assigned to this case' });
    }

    await caseData.save();

    // Log user removal
    await logCaseAction(caseId, 'removed_user', requesterId, `${removedUser?.name} removed from case`);

    const updatedCase = await Case.findById(caseId)
      .populate('clientId', 'name email')
      .populate('caseCreatedBy', 'name email firm')
      .populate('assignedUsers.userId', 'name email firm');

    res.json({
      success: true,
      message: 'User removed from case',
      case: updatedCase
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
