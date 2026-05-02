import React, { useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCaseContext } from '../hooks/useCaseContext';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cases, fetchCases } = useCaseContext();
  const userRole = user?.role;
  const isClient = userRole === 'client';
  const isLawyer = userRole === 'lawyer';
  const isParalegal = userRole === 'paralegal';
  const isAdmin = userRole === 'admin';
  const userId = user?.id || user?._id;

  useEffect(() => {
    if (user && cases.length === 0) {
      fetchCases();
    }
  }, [user, cases.length, fetchCases]);

  const inboxMessages = useMemo(() => {
    if (!user || !cases?.length) return [];

    return cases
      .flatMap((caseItem) => {
        const caseId = caseItem._id || caseItem.id;
        return (caseItem.notifications || [])
          .filter((notification) => {
            const recipientByRole = notification.recipientRoles?.includes(user.role);
            const recipientById = notification.recipientIds?.some(
              (id) => id?.toString?.() === userId
            );
            return (
              recipientByRole ||
              recipientById ||
              (!notification.recipientRoles?.length && !notification.recipientIds?.length)
            );
          })
          .map((notification) => ({
            id:
              notification.id ||
              `${caseId}-${notification.createdAt || notification.message?.slice(0, 20)}`,
            caseId,
            caseTitle: caseItem.title,
            message: notification.message,
            createdAt: notification.createdAt,
            type: notification.type
          }));
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [cases, user, userId]);

  const caseRoutePrefix =
    isClient ? '/client' : isLawyer ? '/lawyer' : isParalegal ? '/staff' : isAdmin ? '/admin' : '/';

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
  const triagePath = '/client/triage';

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

            {isClient && (
              <li className="nav-item">
                <Link
                  to={triagePath}
                  className={`nav-link ${isActive(triagePath) ? 'active' : ''}`}
                >
                   Triage
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
              className="btn btn-light position-relative"
              data-bs-toggle="dropdown"
            >
              <i className="bi bi-chat-square-text-fill"></i>
              {inboxMessages.length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {inboxMessages.length}
                </span>
              )}
            </button>

            <ul
              className="dropdown-menu dropdown-menu-end p-2"
              style={{ width: '320px', maxHeight: '400px', overflowY: 'auto' }}
            >
              <li className="dropdown-header fw-bold">Inbox</li>

              <li><hr className="dropdown-divider" /></li>

              {inboxMessages.length === 0 ? (
                <li className="text-center text-muted py-3">
                  No messages in your inbox
                </li>
              ) : (
                inboxMessages.map((msg) => {
                  const messageLink = isAdmin
                    ? '/admin/dashboard'
                    : `${caseRoutePrefix}/case/${msg.caseId}`;

                  return (
                    <li key={msg.id}>
                      <Link
                        to={messageLink}
                        className="dropdown-item"
                      >
                        <div className="fw-semibold">{msg.caseTitle}</div>
                        <small className="text-muted">
                          {msg.message}
                        </small>
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

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