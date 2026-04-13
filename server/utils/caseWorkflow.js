/**
 * Case workflow state machine and transition rules
 * Defines valid state transitions and role permissions for each transition
 */

export const CASE_STATES = {
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
export const STATE_TRANSITIONS = {
  [CASE_STATES.NEW]: {
    [CASE_STATES.DRAFTING]: ['lawyer', 'paralegal']
  },
  [CASE_STATES.DRAFTING]: {
    [CASE_STATES.FILED]: ['lawyer'],
    [CASE_STATES.DRAFTING]: ['lawyer', 'paralegal'] // Allow redrrafting
  },
  [CASE_STATES.FILED]: {
    [CASE_STATES.HEARING]: ['lawyer', 'paralegal']
  },
  [CASE_STATES.HEARING]: {
    [CASE_STATES.JUDGMENT]: ['lawyer']
  },
  [CASE_STATES.JUDGMENT]: {
    [CASE_STATES.CLOSED]: ['lawyer']
  },
  [CASE_STATES.CLOSED]: {
    // Closed cases cannot transition
  }
};

/**
 * Check if a state transition is valid
 * @param {string} currentStatus - Current case status
 * @param {string} nextStatus - Desired next status
 * @param {string} userRole - Role of the user requesting the transition
 * @returns {object} - { valid: boolean, error?: string }
 */
export const isValidTransition = (currentStatus, nextStatus, userRole) => {
  if (currentStatus === nextStatus) {
    return { valid: false, error: 'New status must be different from current status' };
  }

  const validTransitions = STATE_TRANSITIONS[currentStatus];
  
  if (!validTransitions) {
    return { valid: false, error: `No transitions available from status: ${currentStatus}` };
  }

  const allowedRoles = validTransitions[nextStatus];
  
  if (!allowedRoles) {
    return { 
      valid: false, 
      error: `Cannot transition from ${currentStatus} to ${nextStatus}` 
    };
  }

  if (!allowedRoles.includes(userRole)) {
    return { 
      valid: false, 
      error: `Role '${userRole}' is not authorized to transition to ${nextStatus}. Allowed roles: ${allowedRoles.join(', ')}` 
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
 * Get human-readable description of a state
 * @param {string} state - Case state
 * @returns {string} - Human-readable description
 */
export const getStateDescription = (state) => {
  const descriptions = {
    [CASE_STATES.NEW]: 'Case is created and client details are recorded',
    [CASE_STATES.DRAFTING]: 'Legal documents are prepared and reviewed',
    [CASE_STATES.FILED]: 'Case is officially submitted to court',
    [CASE_STATES.HEARING]: 'Court proceedings take place',
    [CASE_STATES.JUDGMENT]: 'Court decision is issued',
    [CASE_STATES.CLOSED]: 'Case is completed or archived'
  };

  return descriptions[state] || 'Unknown state';
};

/**
 * Get state transition conditions
 * @param {string} fromState - Current state
 * @param {string} toState - Next state
 * @returns {array} - Array of conditions that must be met
 */
export const getTransitionConditions = (fromState, toState) => {
  const conditions = {
    [`${CASE_STATES.NEW}→${CASE_STATES.DRAFTING}`]: ['Case must be accepted by legal team'],
    [`${CASE_STATES.DRAFTING}→${CASE_STATES.FILED}`]: ['Documents must be approved', 'Case must have all required documents'],
    [`${CASE_STATES.FILED}→${CASE_STATES.HEARING}`]: ['Court date must be assigned'],
    [`${CASE_STATES.HEARING}→${CASE_STATES.JUDGMENT}`]: ['Hearing must be completed'],
    [`${CASE_STATES.JUDGMENT}→${CASE_STATES.CLOSED}`]: ['No appeals filed']
  };

  const key = `${fromState}→${toState}`;
  return conditions[key] || [];
};
