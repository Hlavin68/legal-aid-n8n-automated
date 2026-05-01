export const WORKFLOW_STEPS = [
  { key: 'new', label: 'New' },
  { key: 'drafting', label: 'Drafting' },
  { key: 'filed', label: 'Filed' },
  { key: 'hearing', label: 'Hearing' },
  { key: 'judgment', label: 'Judgment' },
  { key: 'closed', label: 'Closed' }
];

export const NEXT_STAGE_MAP = {
  new: 'drafting',
  drafting: 'filed',
  filed: 'hearing',
  hearing: 'judgment',
  judgment: 'closed'
};

export const STEP_CONFIG = {
  new: {
    title: 'Case Intake',
    actions: ['Collect client details', 'Review case scope'],
    role: ['lawyer', 'paralegal']
  },
  drafting: {
    title: 'Drafting Pleadings',
    actions: [
      'Upload Plaint',
      'Upload Verifying Affidavit',
      'Upload Witness Statements'
    ],
    role: ['paralegal', 'lawyer']
  },
  filed: {
    title: 'Filed',
    actions: ['Upload Filed Plaint'],
    role: ['paralegal', 'lawyer']
  },
  hearing: {
    title: 'Hearing',
    actions: ['Upload Hearing Evidence'],
    role: ['paralegal', 'lawyer']
  },
  judgment: {
    title: 'Judgment',
    actions: ['Upload Judgment'],
    role: ['lawyer']
  },
  closed: {
    title: 'Closed',
    actions: ['Review case closure'],
    role: ['lawyer']
  }
};

export const getStatusLabel = (status) => {
  const labels = {
    new: 'New',
    drafting: 'Drafting',
    filed: 'Filed',
    hearing: 'Hearing',
    judgment: 'Judgment',
    closed: 'Closed'
  };
  return labels[status] || status;
};
