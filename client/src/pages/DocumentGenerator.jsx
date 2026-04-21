import React, { useState } from "react";
import { Card, TextInput, Button } from "../components/ui";

const documentTemplates = {
  demand_letter: {
    name: "Demand Letter",
    template: (data) => `DEMAND LETTER

Date: ${data.issueDate}

To: [Recipient Name and Address]

RE: FORMAL DEMAND FOR [SUBJECT MATTER]

Dear Sir/Madam,

This letter serves as a formal demand for [specify claim]. As of the date of this letter, the outstanding amount/obligation is ${data.amount || "to be specified"}.

Details:
- Issue Date: ${data.issueDate}
- Amount/Obligation: ${data.amount || "[To be specified]"}
- Reason: [Provide detailed reason]

You are hereby required to settle this claim within fourteen (14) days of receiving this letter.

Yours faithfully,

[Your Name]`
  },

  agreement: {
    name: "Simple Agreement",
    template: (data) => `AGREEMENT

This Agreement is entered into on ${data.issueDate}

BETWEEN:
[Party 1 Name]
AND:
[Party 2 Name]

1. TERMS
[Insert terms here]

2. DURATION
Starts on ${data.issueDate}

3. GOVERNING LAW
Kenya`
  },

  complaint_letter: {
    name: "Complaint Letter",
    template: (data) => `COMPLAINT LETTER

Date: ${data.issueDate}

To: [Recipient]

RE: COMPLAINT

I am writing to complain about:

[Describe issue]

Requested resolution:
[What you want done]

Date: ${data.issueDate}`
  },

  will_summary: {
    name: "Will Summary",
    template: (data) => `WILL SUMMARY

Prepared: ${data.issueDate}

Beneficiaries:
[Add details]

Assets:
[Add assets]

Executor:
[Add executor]

Date: ${data.issueDate}`
  }
};

export function DocumentGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [formData, setFormData] = useState({
    issueDate: new Date().toISOString().split("T")[0],
    amount: "",
    notes: ""
  });

  const [generatedDocument, setGeneratedDocument] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDocument = () => {
    if (!selectedTemplate) return alert("Select a template");

    setIsGenerating(true);

    setTimeout(() => {
      const template = documentTemplates[selectedTemplate];
      const result = template.template(formData);
      setGeneratedDocument(result);
      setIsGenerating(false);
    }, 500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedDocument);
    alert("Copied!");
  };

  const handleDownload = () => {
    const blob = new Blob([generatedDocument], { type: "text/plain" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = `${selectedTemplate}_${formData.issueDate}.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container py-4">

      {/* HEADER */}
      <div className="text-center mb-4">
        <h1 className="fw-bold"> Document Generator</h1>
        <p className="text-muted">
          Generate legal documents using templates
        </p>
      </div>

      {/* GRID */}
      <div className="row g-4">

        {/* FORM SECTION */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0">
            <div className="card-body">

              <h5 className="mb-3">Select Template</h5>

              {/* TEMPLATE SELECT */}
              <select
                className="form-select mb-3"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                <option value="">Choose a template...</option>
                {Object.entries(documentTemplates).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name}
                  </option>
                ))}
              </select>

              {/* DATE */}
              <div className="mb-3">
                <label className="form-label">Issue Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.issueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, issueDate: e.target.value })
                  }
                />
              </div>

              {/* AMOUNT (only demand letter) */}
              {selectedTemplate === "demand_letter" && (
                <div className="mb-3">
                  <label className="form-label">Amount</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. KES 50,000"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                  />
                </div>
              )}

              {/* NOTES */}
              <div className="mb-3">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Optional details..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

              {/* GENERATE BUTTON */}
              <button
                className="btn btn-primary w-100"
                onClick={handleGenerateDocument}
                disabled={!selectedTemplate || isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate Document"}
              </button>

            </div>
          </div>
        </div>

        {/* PREVIEW SECTION */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0">
            <div className="card-body">

              <h5 className="mb-3">Document Preview</h5>

              {generatedDocument ? (
                <>
                  <pre
                    className="bg-dark text-light p-3 rounded"
                    style={{
                      height: "450px",
                      overflow: "auto",
                      whiteSpace: "pre-wrap",
                      fontSize: "0.85rem"
                    }}
                  >
                    {generatedDocument}
                  </pre>

                  <div className="d-flex gap-2 mt-3">
                    <button className="btn btn-outline-primary w-50" onClick={handleCopy}>
                       Copy
                    </button>

                    <button className="btn btn-outline-secondary w-50" onClick={handleDownload}>
                       Download
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-muted">
                  No document generated yet. Select a template and click generate.
                </p>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* TEMPLATE LIST */}
      {!generatedDocument && (
        <div className="card shadow-sm border-0 mt-4">
          <div className="card-body">
            <h5 className="mb-3"> Available Templates</h5>

            <div className="row g-3">
              {Object.entries(documentTemplates).map(([key, value]) => (
                <div className="col-md-6" key={key}>
                  <div className="border rounded p-3 h-100">

                    <h6 className="fw-bold">{value.name}</h6>

                    <p className="text-muted small">
                      {key === "demand_letter" &&
                        "Formal demand for payment or obligation."}
                      {key === "agreement" &&
                        "Simple agreement between two parties."}
                      {key === "complaint_letter" &&
                        "Formal complaint document."}
                      {key === "will_summary" &&
                        "Estate planning summary document."}
                    </p>

                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        setSelectedTemplate(key);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Use Template
                    </button>

                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default DocumentGenerator;