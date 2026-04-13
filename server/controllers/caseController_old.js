import Case from '../models/Case.js';
import User from '../models/User.js';
import { isValidTransition, CASE_STATUSES } from '../utils/caseStateTransitions.js';

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
      // Lawyers/Paralegals see cases created by them or assigned to them
      query.$or = [
        { caseCreatedBy: userId },
        { 'assignedUsers.userId': userId }
      ];
    }

    const cases = await Case.find(query)
      .populate('clientId', 'name email')
      .populate('caseCreatedBy', 'name email firm licenseNumber')
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
 * Get case by ID
 * Authorization: 
 * - Clients can only view their own cases
 * - Lawyers/Paralegals can view cases they created or are assigned to
 */
export const getCaseById = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const caseData = await Case.findById(caseId)
      .populate('clientId', 'name email')
      .populate('caseCreatedBy', 'name email firm licenseNumber')
      .populate('assignedUsers.userId', 'name email firm');

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

    res.json({
      success: true,
      case: caseData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a new case
 * Authorization: Lawyers and Paralegals ONLY
 * They must specify the clientId for whom the case is being created
 */
export const createCase = async (req, res) => {
  try {
    const { title, category, description, clientEmail } = req.body;
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

    // Create case with draft status
    const newCase = new Case({
      title,
      category,
      description,
      clientId: client._id,
      caseCreatedBy: userId,
      status: CASE_STATUSES.DRAFT,
      assignedUsers: [{
        userId,
        role: userRole
      }]
    });

    await newCase.save();
    await newCase.populate('clientId', 'name email');
    await newCase.populate('caseCreatedBy', 'name email firm licenseNumber');
    await newCase.populate('assignedUsers.userId', 'name email firm');

    res.status(201).json({
      success: true,
      message: 'Case created successfully',
      case: newCase
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update case
 * Authorization:
 * - Lawyers/Paralegals: Can update case details (except status transition - use separate endpoint)
 * - Clients: Can only upload documents and add notes/questions
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
          error: 'Clients can only upload documents and add notes/questions' 
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

    const updatedCase = await Case.findByIdAndUpdate(
      caseId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    )
      .populate('clientId', 'name email')
      .populate('caseCreatedBy', 'name email firm')
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
 * Change case status with state transition validation
 * Authorization: Lawyers and Paralegals who created or are assigned to the case
 * Enforces valid lifecycle transitions: draft -> open -> in-progress -> closed -> archived
 */
export const changeStatus = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { newStatus } = req.body;
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

    // Validate status transition
    if (!isValidTransition(caseData.status, newStatus)) {
      return res.status(400).json({
        error: `Invalid status transition from '${caseData.status}' to '${newStatus}'`,
        currentStatus: caseData.status,
        requestedStatus: newStatus,
        validTransitions: caseData.status === 'draft' ? ['open'] : 
                         caseData.status === 'open' ? ['in-progress'] :
                         caseData.status === 'in-progress' ? ['closed'] :
                         caseData.status === 'closed' ? ['archived'] : []
      });
    }

    // Update status and timestamp
    caseData.status = newStatus;
    caseData.updatedAt = new Date();
    await caseData.save();

    const updatedCase = await Case.findById(caseId)
      .populate('clientId', 'name email')
      .populate('caseCreatedBy', 'name email firm')
      .populate('assignedUsers.userId', 'name email firm');

    res.json({
      success: true,
      message: `Case status changed to '${newStatus}'`,
      case: updatedCase
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete case
 * Authorization: Only lawyers/paralegals who created the case can delete it
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
      return res.status(403).json({ error: 'Only the case creator can delete this case' });
    }

    await Case.findByIdAndDelete(caseId);

    res.json({
      success: true,
      message: 'Case deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add note to case
export const addNote = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    caseData.notes.push({
      id: Date.now().toString(),
      content,
      author: userId,
      timestamp: new Date()
    });

    await caseData.save();
    await caseData.populate('clientId', 'name email');

    res.json({
      success: true,
      case: caseData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete note from case
export const deleteNote = async (req, res) => {
  try {
    const { caseId, noteId } = req.params;

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    caseData.notes = caseData.notes.filter(n => n.id !== noteId);
    await caseData.save();

    res.json({
      success: true,
      case: caseData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add deadline
export const addDeadline = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { title, date } = req.body;

    if (!title || !date) {
      return res.status(400).json({
        error: 'Title and date are required'
      });
    }

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    caseData.deadlines.push({
      id: Date.now().toString(),
      title,
      date: new Date(date)
    });

    await caseData.save();

    res.json({
      success: true,
      case: caseData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete deadline
export const deleteDeadline = async (req, res) => {
  try {
    const { caseId, deadlineId } = req.params;

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    caseData.deadlines = caseData.deadlines.filter(d => d.id !== deadlineId);
    await caseData.save();

    res.json({
      success: true,
      case: caseData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get case base (published/completed cases)
export const getCaseBase = async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = { caseBase: true, status: 'closed' };

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

    if (caseData.status !== CASE_STATUSES.CLOSED && caseData.status !== 'closed') {
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
    const { userId, userRole } = req.body;
    const requesterId = req.user.id;

    if (!userId || !userRole) {
      return res.status(400).json({ error: 'userId and userRole are required' });
    }

    if (!['lawyer', 'paralegal'].includes(userRole)) {
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
    const user = await User.findById(userId);
    if (!user || !['lawyer', 'paralegal'].includes(user.role)) {
      return res.status(400).json({ error: 'Invalid user ID or user is not a lawyer/paralegal' });
    }

    // Check if already assigned
    const alreadyAssigned = caseData.assignedUsers.some(u => u.userId.toString() === userId);
    if (alreadyAssigned) {
      return res.status(400).json({ error: 'User is already assigned to this case' });
    }

    // Add user to assignedUsers
    caseData.assignedUsers.push({
      userId,
      role: user.role
    });

    await caseData.save();

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

    // Remove user from assignedUsers
    const initialLength = caseData.assignedUsers.length;
    caseData.assignedUsers = caseData.assignedUsers.filter(
      u => u.userId.toString() !== userId
    );

    if (caseData.assignedUsers.length === initialLength) {
      return res.status(404).json({ error: 'User is not assigned to this case' });
    }

    await caseData.save();

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
