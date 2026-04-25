import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const userRole = user?.role;
  const isClient = userRole === 'client';
  const isLawyer = userRole === 'lawyer';
  const isParalegal = userRole === 'paralegal';
  const isAdmin = userRole === 'admin';

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const dashboardPath =
    isClient ? '/client/dashboard' : isLawyer ? '/lawyer/dashboard' : isParalegal ? '/staff/dashboard' : isAdmin ? '/admin/dashboard' : '/';
  const chatPath =
    isClient ? '/client/chat' : isLawyer ? '/lawyer/chat' : isParalegal ? '/staff/chat' : '/';
  const caseBasePath =
    isClient ? '/client/case-base' : isLawyer ? '/lawyer/case-base' : isParalegal ? '/staff/case-base' : '/';
  const documentsPath =
    isClient ? '/client/documents' : isLawyer ? '/lawyer/documents' : '/';

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

            {(isClient || isLawyer) && (
              <li className="nav-item">
                <Link
                  to={documentsPath}
                  className={`nav-link ${isActive(documentsPath) ? 'active' : ''}`}
                >
                   Documents
                </Link>
              </li>
            )}

            {(isClient || isLawyer || isParalegal) && (
              <li className="nav-item">
                <Link
                  to={caseBasePath}
                  className={`nav-link ${isActive(caseBasePath) ? 'active' : ''}`}
                >
                   Case Library
                </Link>
              </li>
            )}

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
                  {isClient ? 'Client' : isLawyer ? 'Lawyer' : isParalegal ? 'Paralegal' : isAdmin ? 'Admin' : 'User'}
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