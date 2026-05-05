import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, TextInput } from '../components/ui';
import { validateResetToken, resetPassword as resetPasswordAPI } from '../services/api';

function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  // Validate token on component mount
  useEffect(() => {
    validateToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const validateToken = async () => {
    try {
      if (!token) {
        setError('Invalid reset link. Token is missing.');
        setLoading(false);
        return;
      }

      const result = await validateResetToken(token);

      if (result.success) {
        setError('');
      } else {
        setError(result.error || 'Invalid or expired reset link');
      }
    } catch (err) {
      setError(err.message || 'Unable to validate reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidating(true);

    try {
      // Validate form
      if (!formData.password || !formData.confirmPassword) {
        setError('Both password fields are required');
        setValidating(false);
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        setValidating(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setValidating(false);
        return;
      }

      // Submit password reset
      const result = await resetPasswordAPI(token, formData.password, formData.confirmPassword);

      if (result.success) {
        setSuccess(true);
        // Redirect to dashboard after success
        setTimeout(() => {
          navigate('/client/dashboard');
        }, 3000);
      } else {
        setError(result.error || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="text-center mb-5">
          <h1>⚖️ Legal Aid Assistant</h1>
          <p className="text-muted">Set Your New Password</p>
        </div>

        <div className="row justify-content-center">
          <div className="col-md-5">
            <Card className="p-4">
              {loading ? (
                <div className="text-center">
                  <p>Validating reset link...</p>
                  <div className="spinner-border mt-3" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                </div>
              ) : error && !success ? (
                <div className="text-center">
                  <div className="mb-3">
                    <h3 className="text-danger">✗ Invalid Reset Link</h3>
                  </div>
                  <p className="text-muted mb-4">{error}</p>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="btn btn-primary"
                  >
                    Request New Reset Link
                  </button>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => navigate('/auth')}
                      className="btn btn-link"
                    >
                      Back to Login
                    </button>
                  </div>
                </div>
              ) : success ? (
                <div className="text-center">
                  <div className="mb-3">
                    <h3 className="text-success">✓ Password Reset Successfully</h3>
                  </div>
                  <p className="text-muted mb-4">
                    Your password has been reset. You can now log in with your new password.
                  </p>
                  <p className="text-muted small mb-4">
                    Redirecting to dashboard...
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/client/dashboard')}
                    className="btn btn-primary"
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-center mb-3">Reset Password</h2>
                  <p className="text-center text-muted mb-4">
                    Enter your new password below
                  </p>

                  {error && (
                    <div className="alert alert-danger mb-3">
                      <strong>Error:</strong> {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <TextInput
                      label="New Password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(value) =>
                        setFormData({ ...formData, password: value })
                      }
                      placeholder="Enter new password"
                      required
                    />
                    <div className="mb-3">
                      <label className="form-check-label small">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={showPassword}
                          onChange={(e) => setShowPassword(e.target.checked)}
                        />
                        Show password
                      </label>
                    </div>

                    <TextInput
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(value) =>
                        setFormData({ ...formData, confirmPassword: value })
                      }
                      placeholder="Confirm new password"
                      required
                    />
                    <div className="mb-3">
                      <label className="form-check-label small">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={showConfirmPassword}
                          onChange={(e) => setShowConfirmPassword(e.target.checked)}
                        />
                        Show password
                      </label>
                    </div>

                    <div className="small text-muted mb-3">
                      Password must be at least 6 characters long
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={validating || !formData.password || !formData.confirmPassword}
                      className="w-100 mb-3"
                    >
                      {validating ? 'Resetting password...' : 'Reset Password'}
                    </Button>
                  </form>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => navigate('/auth')}
                      className="btn btn-link p-0"
                    >
                      Back to Login
                    </button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
