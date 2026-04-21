import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isClient = user?.role === 'client';

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const dashboardPath = isClient ? '/client/dashboard' : '/lawyer/dashboard';
  const chatPath = isClient ? '/client/chat' : '/lawyer/chat';
  const caseBasePath = isClient ? '/client/case-base' : '/lawyer/case-base';
  const documentsPath = '/client/documents';

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark shadow-sm"
      style={{
        background: 'linear-gradient(135deg, #0f0f23, #1a1a2e)'
      }}
    >
      <div className="container-fluid">
        <Link to={dashboardPath} className="navbar-brand fw-bold">
          ⚖️ Legal Aid
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">

            <li className="nav-item">
              <Link
                to={dashboardPath}
                className={`nav-link ${isActive(dashboardPath) ? 'active' : ''}`}
              >
                 Dashboard
              </Link>
            </li>

            <li className="nav-item">
              <Link
                to={chatPath}
                className={`nav-link ${isActive(chatPath) ? 'active' : ''}`}
              >
                 Chat
              </Link>
            </li>

            {isClient && (
              <li className="nav-item">
                <Link
                  to={documentsPath}
                  className={`nav-link ${isActive(documentsPath) ? 'active' : ''}`}
                >
                   Documents
                </Link>
              </li>
            )}

            <li className="nav-item">
              <Link
                to={caseBasePath}
                className={`nav-link ${isActive(caseBasePath) ? 'active' : ''}`}
              >
                 Case Library
              </Link>
            </li>

          </ul>

          <div className="dropdown">
            <button
              className="btn btn-light dropdown-toggle"
              data-bs-toggle="dropdown"
            >
              👤 {user?.name}
            </button>

            <ul className="dropdown-menu dropdown-menu-end">
              <li className="dropdown-item-text">
                <div className="fw-bold">{user?.name}</div>
                <small>{user?.email}</small>
                <br />
                <small className="text-muted">
                  {isClient ? ' Client' : ' Lawyer'}
                </small>
              </li>

              <li><hr className="dropdown-divider" /></li>

              <li>
                <button onClick={handleLogout} className="dropdown-item">
                   Sign Out
                </button>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navigation;