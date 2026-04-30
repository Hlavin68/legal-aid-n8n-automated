import Case from '../models/Case.js';

const normalizeId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value._id) return value._id.toString();
  if (typeof value.toString === 'function') return value.toString();
  return null;
};

export const getCaseRole = (userId, systemRole, caseData) => {
  if (!caseData) return null;

  if (normalizeId(caseData.clientId) === userId) {
    return 'client';
  }

  if (normalizeId(caseData.lawyerId) === userId) {
    return 'lawyer';
  }

  const assignedUser = caseData.assignedUsers?.find((member) =>
    normalizeId(member.userId) === userId
  );

  if (assignedUser) {
    return assignedUser.role;
  }

  // If the user created the case but is not explicitly assigned, fall back to their system role
  if (normalizeId(caseData.caseCreatedBy) === userId) {
    return systemRole;
  }

  return null;
};

export const loadCase = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const caseData = await Case.findById(caseId).populate('assignedUsers.userId', 'name email role');

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    req.caseData = caseData;
    req.caseRole = getCaseRole(req.user.id, req.user.role, caseData);

    return next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const requireCaseMembership = (options = {}) => {
  const { allowAdmin = true } = options;

  return (req, res, next) => {
    if (allowAdmin && req.user.role === 'admin') {
      return next();
    }

    if (!req.caseRole) {
      return res.status(403).json({ error: 'Permission denied: insufficient role' });
    }

    return next();
  };
};

export const requireCaseRole = (allowedRoles = [], options = {}) => {
  const { allowAdmin = false } = options;

  return (req, res, next) => {
    if (allowAdmin && req.user.role === 'admin') {
      return next();
    }

    if (!req.caseRole || !allowedRoles.includes(req.caseRole)) {
      return res.status(403).json({ error: 'Permission denied: insufficient role' });
    }

    return next();
  };
};

export const requireCaseCreatorOrAdmin = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }

  if (req.caseData?.caseCreatedBy?.toString() === req.user.id) {
    return next();
  }

  return res.status(403).json({ error: 'Permission denied: insufficient role' });
};
