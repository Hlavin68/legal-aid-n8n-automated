import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, TextInput } from '../components/ui';
import { forgotPassword as forgotPasswordAPI } from '../services/api';

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email) {
        setError('Please enter your email address');
        setLoading(false);
        return;
      }

      const result = await forgotPasswordAPI(email);

      if (result.success) {
        setSuccess(true);
        if (result.resetLink) {
          setResetLink(result.resetLink);
        }
        // Show for a few seconds then redirect to login
        setTimeout(() => {
          navigate('/auth');
        }, 8000);
      } else {
        setError(result.error || 'Failed to process password reset request');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="text-center mb-5">
          <h1>⚖️ Legal Aid Assistant</h1>
          <p className="text-muted">Reset Your Password</p>
        </div>

        <div className="row justify-content-center">
          <div className="col-md-5">
            <Card className="p-4">
              {success ? (
                <div className="text-center">
                  <div className="mb-3">
                    <h3 className="text-success">✓ Check Your Email</h3>
                  </div>
                  <p className="text-muted mb-4">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                  
                  {resetLink && (
                    <div className="alert alert-info mb-3">
                      <strong>Development Mode:</strong>
                      <p className="mb-2 small">Click the link below to reset your password:</p>
                      <a 
                        href={resetLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-info"
                      >
                        Reset Password Link
                      </a>
                      <p className="mt-2 small text-muted">
                        Or copy and paste this URL:
                      </p>
                      <div className="bg-light p-2 rounded" style={{ wordBreak: 'break-all', fontSize: '0.85rem' }}>
                        {resetLink}
                      </div>
                    </div>
                  )}
                  
                  <p className="small text-muted mb-3">
                    The link will expire in 1 hour. If you don't see the email, check your spam folder.
                  </p>
                  <p className="text-muted small mb-4">
                    Redirecting to login page...
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/auth')}
                    className="btn btn-primary"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-center mb-3">Forgot Password?</h2>
                  <p className="text-center text-muted mb-4">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>

                  {error && (
                    <div className="alert alert-danger mb-3">
                      <strong>Error:</strong> {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <TextInput
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="your@email.com"
                      required
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={loading || !email}
                      className="w-100 mb-3"
                    >
                      {loading ? 'Sending reset link...' : 'Send Reset Link'}
                    </Button>
                  </form>

                  <div className="text-center">
                    <p className="text-muted small mb-0">
                      Remember your password?{' '}
                      <button
                        type="button"
                        onClick={() => navigate('/auth')}
                        className="btn btn-link p-0"
                      >
                        Back to Login
                      </button>
                    </p>
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

export default ForgotPassword;
