// Mock cases data
export const mockCases = [
  {
    id: '1',
    title: 'Land Dispute Resolution',
    category: 'Property Law',
    status: 'filed',
    description: 'Boundary dispute with neighboring property regarding land ownership.',
    createdAt: '2024-01-15',
    updatedAt: '2024-03-20',
    notes: [
      { id: '1', content: 'Initial consultation completed', timestamp: '2024-01-15' },
      { id: '2', content: 'Survey report received', timestamp: '2024-02-10' }
    ],
    documents: [
      { id: '1', name: 'Deed of Purchase', type: 'pdf' },
      { id: '2', name: 'Survey Report 2024', type: 'pdf' }
    ],
    deadlines: [
      { id: '1', title: 'Submit Counter Claim', date: '2024-04-15' },
      { id: '2', title: 'Court Hearing', date: '2024-05-20' }
    ],
    suggestedSteps: [
      'Obtain certified title deed',
      'Get professional survey done',
      'Prepare written response to allegations',
      'Gather witness statements',
      'File counter-claim with court'
    ],
    summary: null
  },
  {
    id: '2',
    title: 'Employment Contract Review',
    category: 'Employment Law',
    status: 'new',
    description: 'Review and negotiation of employment contract terms and conditions.',
    createdAt: '2024-03-18',
    updatedAt: '2024-03-18',
    notes: [
      { id: '1', content: 'Received contract for review', timestamp: '2024-03-18' }
    ],
    documents: [
      { id: '1', name: 'Employment Contract', type: 'pdf' }
    ],
    deadlines: [
      { id: '1', title: 'Provide feedback to employer', date: '2024-04-05' }
    ],
    suggestedSteps: [
      'Review compensation and benefits',
      'Check non-compete clauses',
      'Verify leave and holiday provisions',
      'Negotiate salary terms',
      'Sign and retain copies'
    ],
    summary: null
  },
  {
    id: '3',
    title: 'Family Inheritance Matter',
    category: 'Family Law',
    status: 'hearing',
    description: 'Estate distribution and inheritance rights settlement.',
    createdAt: '2024-02-28',
    updatedAt: '2024-03-12',
    notes: [
      { id: '1', content: 'Discussed with all beneficiaries', timestamp: '2024-02-28' },
      { id: '2', content: 'Valuation of estate underway', timestamp: '2024-03-10' }
    ],
    documents: [
      { id: '1', name: 'Will Document', type: 'pdf' },
      { id: '2', name: 'Estate Valuation', type: 'pdf' }
    ],
    deadlines: [
      { id: '1', title: 'Complete estate valuation', date: '2024-04-10' },
      { id: '2', title: 'File distribution petition', date: '2024-05-01' }
    ],
    suggestedSteps: [
      'Obtain certified copy of will',
      'Register with succession court',
      'Advertise for creditors',
      'Obtain estate valuation',
      'Prepare distribution schedule'
    ],
    summary: null
  }
];

// Mock status options (must match backend Case.js enum)
// Workflow: new → drafting → filed → hearing → judgment → closed
export const statusOptions = ['new', 'drafting', 'filed', 'hearing', 'judgment', 'closed'];

// Mock categories
export const categoryOptions = [
  'Property Law',
  'Employment Law',
  'Family Law',
  'Criminal Law',
  'Business & Contracts',
  'Corporate Law',
  'Immigration',
  'Intellectual Property'
];
