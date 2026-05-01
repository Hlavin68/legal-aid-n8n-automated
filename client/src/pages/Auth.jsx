import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button, Card, TextInput, Select } from '../components/ui';

function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('client');

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    firm: '',
    licenseNumber: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(loginData.email, loginData.password);

      if (result.success) {
        const roleRoutes = {
          lawyer: '/lawyer/dashboard',
          paralegal: '/staff/dashboard',
          client: '/client/dashboard',
          admin: '/admin/dashboard'
        };

        navigate(roleRoutes[result.user.role] || '/admin/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = await register(
        registerData.name,
        registerData.email,
        registerData.password,
        role,
        registerData.firm || null,
        registerData.licenseNumber || null,
        registerData.username || null
      );

      if (result.success) {
        const roleRoutes = {
          lawyer: '/lawyer/dashboard',
          paralegal: '/staff/dashboard',
          client: '/client/dashboard',
          admin: '/admin/dashboard'
        };

        navigate(roleRoutes[role] || '/admin/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    }

    setLoading(false);
  };

  const switchMode = (mode) => {
    setIsLogin(mode === 'login');
    setError('');
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">

        <div className="text-center mb-5">
          <h1>⚖️ Legal Aid Assistant</h1>
          <p className="text-muted">Kenyan Legal System Support</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="row justify-content-center">
          <div className="col-md-6">

            <Card className="p-4">

              {isLogin ? (
                <>
                  <h2 className="text-center mb-4">Sign In</h2>

                  <form onSubmit={handleLogin}>
                    <TextInput
                      label="Email"
                      type="email"
                      value={loginData.email}
                      onChange={(value) =>
                        setLoginData({ ...loginData, email: value })
                      }
                      required
                    />

                    <TextInput
                      label="Password"
                      type="password"
                      value={loginData.password}
                      onChange={(value) =>
                        setLoginData({ ...loginData, password: value })
                      }
                      required
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={loading || !loginData.email || !loginData.password}
                      className="w-100"
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>

                  <div className="text-center mt-3">
                    <p>Don't have an account?</p>
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="btn btn-link"
                    >
                      Create Account
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-center mb-4">Create Account</h2>

                  <form onSubmit={handleRegister}>
                    <Select
                      label="Account Type"
                      value={role}
                      onChange={setRole}
                      options={[
                        { value: 'client', label: 'Client' },
                        { value: 'lawyer', label: 'Lawyer' },
                        { value: 'paralegal', label: 'Paralegal' },
                        { value: 'admin', label: 'Admin' }
                      ]}
                    />

                    <TextInput
                      label="Full Name"
                      value={registerData.name}
                      onChange={(value) =>
                        setRegisterData({ ...registerData, name: value })
                      }
                      required
                    />

                    <TextInput
                      label="Email"
                      type="email"
                      value={registerData.email}
                      onChange={(value) =>
                        setRegisterData({ ...registerData, email: value })
                      }
                      required
                    />

                    <TextInput
                      label="Password"
                      type="password"
                      value={registerData.password}
                      onChange={(value) =>
                        setRegisterData({ ...registerData, password: value })
                      }
                      required
                    />

                    <TextInput
                      label="Confirm Password"
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(value) =>
                        setRegisterData({ ...registerData, confirmPassword: value })
                      }
                      required
                    />

                    {role === 'paralegal' && (
                      <TextInput
                        label="Username"
                        value={registerData.username}
                        onChange={(value) =>
                          setRegisterData({ ...registerData, username: value })
                        }
                        required
                      />
                    )}

                    {(role === 'lawyer' || role === 'paralegal') && (
                      <TextInput
                        label="Law Firm"
                        value={registerData.firm}
                        onChange={(value) =>
                          setRegisterData({ ...registerData, firm: value })
                        }
                        required
                      />
                    )}

                    {role === 'lawyer' && (
                      <TextInput
                        label="License Number"
                        value={registerData.licenseNumber}
                        onChange={(value) =>
                          setRegisterData({ ...registerData, licenseNumber: value })
                        }
                        required
                      />
                    )}

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={loading}
                      className="w-100"
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>

                  <div className="text-center mt-3">
                    <p>Already have an account?</p>
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="btn btn-link"
                    >
                      Sign In
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

export default LoginPage;