import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { triageAPI } from "../services/api";

function TriageCase() {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    caseType: "",
    urgency: "",
    deadline: "",
    description: ""
  });

  const [result, setResult] = useState(null);

  const handleChange = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate("/auth", { replace: true });
      } else if (user?.role !== "client") {
        navigate("/", { replace: true });
      }
    }
  }, [loading, isAuthenticated, user, navigate]);

  const mapN8NLevelToUILevel = (n8nLevel) => {
    const levelMap = {
      'self_help': 'safe',
      'warning': 'warning',
      'urgent': 'urgent'
    };
    return levelMap[n8nLevel] || 'safe';
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        caseType: answers.caseType,
        urgency: answers.urgency,
        deadline: answers.deadline,
        description: answers.description
      };

      const response = await triageAPI.submit(payload);

      const data = response.data?.data || response.data;
      
      // Handle array response from n8n
      const triageResult = Array.isArray(data) ? data[0] : data;
      
      // Extract fields from n8n response
      const n8nLevel = triageResult?.level || 'self_help';
      const uiLevel = mapN8NLevelToUILevel(n8nLevel);
      const recommendation = triageResult?.recommendation || 'Triage submitted successfully.';
      const reason = triageResult?.reason || 'Your situation has been assessed.';

      setResult({
        level: uiLevel,
        message: recommendation,
        reason: reason,
        score: triageResult?.score
      });
    } catch (error) {
      console.error('Triage submit error:', error);
      setResult({
        level: 'warning',
        message: 'There was a problem sending your request. Please try again.',
        reason: error.response?.data?.error || error.message || 'Unknown error'
      });
    }
  };

  const renderProgress = () => {
    const percent = (step / 4) * 100;
    return (
      <div className="progress mb-4">
        <div
          className="progress-bar"
          role="progressbar"
          style={{ width: `${percent}%` }}
        />
      </div>
    );
  };

  const renderResult = () => {
    const color =
      result.level === "urgent"
        ? "danger"
        : result.level === "warning"
        ? "warning"
        : "success";

    return (
      <div className={`card border-${color} p-4 shadow`}>
        <h4 className={`text-${color}`}>
          {result.level === "urgent" && "🚨 Urgent Legal Help Needed"}
          {result.level === "warning" && "⚠️ Consider Legal Advice"}
          {result.level === "safe" && "✅ Self-Help May Be Enough"}
        </h4>

        {result.score && (
          <p className="text-muted small mt-2">
            Assessment Score: <strong>{result.score}/10</strong>
          </p>
        )}

        <p className="mt-3">{result.message}</p>
        <p><strong>Assessment:</strong> {result.reason}</p>

        <hr />

        <h6>Next Steps:</h6>
        <ul>
          <li>Document your situation</li>
          <li>Avoid risky actions</li>
          <li>Contact a legal professional if unsure</li>
        </ul>

        <button
          className="btn btn-outline-secondary mt-3"
          onClick={() => {
            setResult(null);
            setStep(1);
            setAnswers({
              caseType: "",
              urgency: "",
              deadline: "",
              description: ""
            });
          }}
        >
          Start Again
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "client") {
    return null;
  }

  return (
    <div className="container mt-5">
      <div className="card p-4 shadow">
        <h3 className="mb-3">Legal Case Triage</h3>

        {result ? (
          renderResult()
        ) : (
          <>
            {renderProgress()}

            {/* STEP 1 */}
            {step === 1 && (
              <>
                <label className="form-label">What is your issue about?</label>
                <select
                  className="form-select"
                  value={answers.caseType}
                  onChange={(e) => handleChange("caseType", e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="labor">Employment</option>
                  <option value="housing">Housing</option>
                  <option value="family">Family</option>
                  <option value="consumer">Consumer</option>
                </select>

                <button
                  className="btn btn-primary mt-3"
                  disabled={!answers.caseType}
                  onClick={nextStep}
                >
                  Next
                </button>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <label className="form-label">
                  Is there immediate risk or harm?
                </label>
                <select
                  className="form-select"
                  value={answers.urgency}
                  onChange={(e) => handleChange("urgency", e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="none">No</option>
                  <option value="medium">Not sure</option>
                  <option value="high">Yes</option>
                </select>

                <div className="mt-3">
                  <button className="btn btn-secondary me-2" onClick={prevStep}>
                    Back
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={!answers.urgency}
                    onClick={nextStep}
                  >
                    Next
                  </button>
                </div>
              </>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <>
                <label className="form-label">
                  Is there a deadline (court, notice, eviction)?
                </label>
                <select
                  className="form-select"
                  value={answers.deadline}
                  onChange={(e) => handleChange("deadline", e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>

                <div className="mt-3">
                  <button className="btn btn-secondary me-2" onClick={prevStep}>
                    Back
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={!answers.deadline}
                    onClick={nextStep}
                  >
                    Next
                  </button>
                </div>
              </>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <>
                <label className="form-label">
                  Briefly describe your situation
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="e.g. My landlord locked me out..."
                  value={answers.description}
                  onChange={(e) =>
                    handleChange("description", e.target.value)
                  }
                />

                <div className="mt-3">
                  <button className="btn btn-secondary me-2" onClick={prevStep}>
                    Back
                  </button>
                  <button className="btn btn-success" onClick={handleSubmit}>
                    Get Recommendation
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TriageCase;