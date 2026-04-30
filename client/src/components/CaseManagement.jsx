import React from 'react';

const RoleCard = ({ title, description, points }) => (
  <div className="col-md-4 mb-4">
    <div className="card h-100 shadow-sm border-0">
      <div className="card-body">
        <h3 className="h5 fw-bold">{title}</h3>
        <p className="text-muted">{description}</p>
        <ul className="list-unstyled mb-0">
          {points.map((point, index) => (
            <li key={index} className="mb-2">
              <span className="me-2">•</span>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

const CaseManagement = () => {
  return (
    <main>
      <div className="bg-primary text-white py-5 mb-4">
        <div className="container">
          <h1 className="display-5 fw-bold mb-3">Legal Aid Case Management</h1>
          <p className="lead text-white-75 mb-0">
            A clear, role-based case management system that keeps clients informed,
            empowers lawyers to lead legal strategy, and enables paralegals to support execution
            with structure, transparency, and traceability.
          </p>
        </div>
      </div>

      <div className="container py-4">
        <section className="mb-5">
          <div className="row gy-4 align-items-center">
            <div className="col-lg-7">
              <h2 className="fw-bold">Structured responsibilities for every role</h2>
              <p className="text-muted">
                The client, lawyer, and paralegal work from the same case record, but each role
                has different permissions, workflows, and decision authority. This separation keeps
                legal strategy aligned while enabling controlled collaboration across the team.
              </p>
            </div>
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm p-4 bg-light">
                <h3 className="h6 text-uppercase text-primary mb-3">Key design goals</h3>
                <ul className="list-unstyled mb-0 text-muted">
                  <li className="mb-2">Role-based access and workflow enforcement</li>
                  <li className="mb-2">Audit logs and full case history</li>
                  <li className="mb-2">Secure client communications and document handling</li>
                  <li className="mb-2">Clear task delegation between legal staff</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold">Roles and permissions</h2>
            <p className="text-muted mb-0">
              Each participant sees a tailored experience and only acts on the case data within their authority.
            </p>
          </div>
          <div className="row">
            <RoleCard
              title="Client"
              description="The origin point for most cases. Clients provide case details, monitor progress, and collaborate safely."
              points={[
                'Submit new case details, dispute summary, parties, and desired outcomes.',
                'View case status, stage progress, timelines, and outcome summaries.',
                'Upload supporting documents and respond to lawyer questions.',
                'Add clarifications or follow-up notes without changing core legal records.',
                'Receive notifications, deadlines, and approval requests from the legal team.',
              ]}
            />
            <RoleCard
              title="Lawyer"
              description="Primary authority over the case. Lawyers direct strategy, control workflow, and ensure legal correctness."
              points={[
                'Review client submissions, validate case facts, and set legal strategy.',
                'Move cases through lifecycle stages like intake, filing, investigation, hearing, and resolution.',
                'Manage official documents, generate notes, and assign tasks or deadlines.',
                'Approve client actions, delegate work to paralegals, and monitor all contributions.',
                'Access audit trails, case history, and compliance analytics for accountability.',
              ]}
            />
            <RoleCard
              title="Paralegal"
              description="Support role focused on preparation, organization, and case execution under lawyer supervision."
              points={[
                'Access assigned cases and review the existing evidence and documents.',
                'Draft documents, organize filings, and maintain case timelines.',
                'Upload supporting materials and update internal notes or summaries.',
                'Create deadlines and manage administrative tasks as delegated by the lawyer.',
                'Communicate with clients for information gathering, while sensitive decisions stay with the lawyer.',
              ]}
            />
          </div>
        </section>

        <section className="mb-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold">Workflow and collaboration</h2>
            <p className="text-muted mb-0">
              The system maintains a consistent lifecycle while preserving legal controls over every transition.
            </p>
          </div>
          <div className="row gx-4 gy-4">
            {[
              {
                title: 'Client Submission',
                description:
                  'The case begins with a client filing dispute details, documents, and desired outcomes.',
              },
              {
                title: 'Intake & Review',
                description:
                  'A lawyer reviews the intake, validates the scope, and assigns the case to the legal team.',
              },
              {
                title: 'Task Assignment',
                description:
                  'Lawyers delegate drafting, evidence preparation, and follow-ups to paralegals.',
              },
              {
                title: 'Progress Tracking',
                description:
                  'Actions, uploads, deadlines, and communications are recorded in a shared timeline.',
              },
              {
                title: 'Controlled Transition',
                description:
                  'State changes are authorized by the lawyer to enforce legal correctness and compliance.',
              },
            ].map((item) => (
              <div key={item.title} className="col-md-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <h3 className="h6 fw-semibold">{item.title}</h3>
                    <p className="text-muted mb-0">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-5">
          <div className="row gy-4 align-items-center">
            <div className="col-lg-7">
              <h2 className="fw-bold">Secure, transparent, and traceable</h2>
              <p className="text-muted">
                A fully implemented case management system includes role-based dashboards, secure messaging,
                document versioning, and audit logging so every change is visible and accountable.
              </p>
              <ul className="list-unstyled text-muted">
                <li className="mb-2">Role-based dashboards show actions relevant to each user.</li>
                <li className="mb-2">Real-time updates keep clients informed without exposing control they should not have.</li>
                <li className="mb-2">Document versioning preserves legal records and prevents unauthorized edits.</li>
                <li className="mb-2">Audit logs capture every status update, assignment, and communication.</li>
              </ul>
            </div>
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm bg-light p-4">
                <h3 className="h6 fw-bold text-primary mb-3">What this system ensures</h3>
                <p className="mb-2 text-muted">Client stays informed.</p>
                <p className="mb-2 text-muted">Lawyer stays in control.</p>
                <p className="mb-2 text-muted">Paralegal supports efficiently.</p>
                <p className="mb-0 text-muted">All actions remain transparent and legally consistent.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default CaseManagement;
