import React, { useState } from 'react';
import CaseList from './CaseList';
import CaseDetails from './CaseDetails';

const CaseManagement = () => {
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  return (
    <main>
      <div className="bg-primary text-white py-4 mb-4">
        <div className="container">
          <h1 className="mb-1"> Case Management System</h1>
          <p className="mb-0">Track and manage legal cases through their complete lifecycle</p>
        </div>
      </div>

      {selectedCaseId ? (
        <CaseDetails
          caseId={selectedCaseId}
          onBack={() => setSelectedCaseId(null)}
        />
      ) : (
        <CaseList onSelectCase={setSelectedCaseId} />
      )}
    </main>
  );
};

export default CaseManagement;
