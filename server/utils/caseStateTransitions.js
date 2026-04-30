/**
 * Case workflow state machine and transition rules
 * Defines valid state transitions and role permissions for each transition
 */

export const CASE_STATUSES = {
  NEW: 'new',
  DRAFTING: 'drafting',
  FILED: 'filed',
  HEARING: 'hearing',
  JUDGMENT: 'judgment',
  CLOSED: 'closed'
};

/**
 * Define valid state transitions and the roles that can perform them
 * Format: {
 *   fromState: {
 *     toState: ['role1', 'role2', ...]
 *   }
 * }
 */
const STATE_TRANSITIONS = {
  [CASE_STATUSES.NEW]: {
    [CASE_STATUSES.DRAFTING]: ['lawyer']
  },
  [CASE_STATUSES.DRAFTING]: {
    [CASE_STATUSES.FILED]: ['lawyer']
  },
  [CASE_STATUSES.FILED]: {
    [CASE_STATUSES.HEARING]: ['lawyer']
  },
  [CASE_STATUSES.HEARING]: {
    [CASE_STATUSES.JUDGMENT]: ['lawyer']
  },
  [CASE_STATUSES.JUDGMENT]: {
    [CASE_STATUSES.CLOSED]: ['lawyer']
  },
  [CASE_STATUSES.CLOSED]: {
    // Closed cases cannot transition
  }
};

/**
 * Check if a status transition is valid
 * @param {string} currentStatus - Current case status
 * @param {string} newStatus - Desired new status
 * @returns {boolean} - Is transition valid
 */
export const isValidTransition = (currentStatus, newStatus) => {
  if (currentStatus === newStatus) {
    return false;
  }

  const validTransitions = STATE_TRANSITIONS[currentStatus];
  if (!validTransitions) {
    return false;
  }

  return newStatus in validTransitions;
};

/**
 * Check if a specific role can perform a transition
 * @param {string} currentStatus - Current case status
 * @param {string} newStatus - Desired new status
 * @param {string} userRole - Role of the user
 * @returns {object} - { valid: boolean, error?: string, reason?: string }
 */
export const isValidTransitionForRole = (currentStatus, newStatus, userRole) => {
  if (currentStatus === newStatus) {
    return { valid: false, error: 'New status must be different from current status' };
  }

  // Special handling for closed cases
  if (currentStatus === CASE_STATUSES.CLOSED) {
    return { 
      valid: false, 
      error: 'Cannot transition from closed case',
      reason: 'Closed cases are finalized and cannot be modified. Please contact an administrator if you need to reopen this case.',
      statusLabel: getStatusLabel(currentStatus)
    };
  }

  const validTransitions = STATE_TRANSITIONS[currentStatus];
  
  if (!validTransitions) {
    return { valid: false, error: `No transitions available from status: ${currentStatus}` };
  }

  const allowedRoles = validTransitions[newStatus];
  
  if (!allowedRoles) {
    return { 
      valid: false, 
      error: `Cannot transition from ${getStatusLabel(currentStatus)} to ${getStatusLabel(newStatus)}`,
      reason: `This state transition is not allowed in the case workflow.`
    };
  }

  if (!allowedRoles.includes(userRole)) {
    return { 
      valid: false, 
      error: `Insufficient permissions to transition case`,
      reason: `Your role '${userRole}' is not authorized to transition to ${getStatusLabel(newStatus)}. Only ${allowedRoles.join(', ')} can perform this action.`
    };
  }

  return { valid: true };
};

/**
 * Get the next available states for a given current state and user role
 * @param {string} currentStatus - Current case status
 * @param {string} userRole - Role of the user
 * @returns {array} - Array of available next states
 */
export const getAvailableTransitions = (currentStatus, userRole) => {
  const validTransitions = STATE_TRANSITIONS[currentStatus];
  
  if (!validTransitions) {
    return [];
  }

  return Object.entries(validTransitions)
    .filter(([_, roles]) => roles.includes(userRole))
    .map(([nextState, _]) => nextState);
};

/**
 * Get allowed transitions for a given status (ignoring roles)
 * @param {string} status - Current case status
 * @returns {array} - Array of valid transition statuses
 */
export const getAllowedTransitions = (status) => {
  const validTransitions = STATE_TRANSITIONS[status];
  return validTransitions ? Object.keys(validTransitions) : [];
};

/**
 * Get human-readable status label
 * @param {string} status - Case status
 * @returns {string} - Formatted status label
 */
export const getStatusLabel = (status) => {
  const labels = {
    [CASE_STATUSES.NEW]: 'New',
    [CASE_STATUSES.DRAFTING]: 'Drafting',
    [CASE_STATUSES.FILED]: 'Filed',
    [CASE_STATUSES.HEARING]: 'Hearing',
    [CASE_STATUSES.JUDGMENT]: 'Judgment',
    [CASE_STATUSES.CLOSED]: 'Closed'
  };
  return labels[status] || status;
};

/**
 * Get state description
 * @param {string} state - Case state
 * @returns {string} - Human-readable description
 */
export const getStateDescription = (state) => {
  const descriptions = {
    [CASE_STATUSES.NEW]: 'Case is created and client details are recorded',
    [CASE_STATUSES.DRAFTING]: 'Legal documents are prepared and reviewed',
    [CASE_STATUSES.FILED]: 'Case is officially submitted to court',
    [CASE_STATUSES.HEARING]: 'Court proceedings take place',
    [CASE_STATUSES.JUDGMENT]: 'Court decision is issued',
    [CASE_STATUSES.CLOSED]: 'Case is completed or archived'
  };

  return descriptions[state] || 'Unknown state';
};

/**
 * Get transition conditions
 * @param {string} fromState - Current state
 * @param {string} toState - Next state
 * @returns {array} - Array of conditions that should be met
 */
export const getTransitionConditions = (fromState, toState) => {
  const conditions = {
    [`${CASE_STATUSES.NEW}→${CASE_STATUSES.DRAFTING}`]: ['Case must be accepted by legal team'],
    [`${CASE_STATUSES.DRAFTING}→${CASE_STATUSES.FILED}`]: ['Documents must be approved', 'Case must have all required documents'],
    [`${CASE_STATUSES.FILED}→${CASE_STATUSES.HEARING}`]: ['Court date must be assigned'],
    [`${CASE_STATUSES.HEARING}→${CASE_STATUSES.JUDGMENT}`]: ['Hearing must be completed'],
    [`${CASE_STATUSES.JUDGMENT}→${CASE_STATUSES.CLOSED}`]: ['No appeals filed']
  };

  const key = `${fromState}→${toState}`;
  return conditions[key] || [];
};

