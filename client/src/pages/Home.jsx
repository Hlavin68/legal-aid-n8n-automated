import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <>
      {/* HERO SECTION */}
      <div className="bg-dark text-white text-center py-5">
        <div className="container">
          <h1 className="display-4 fw-bold">Legal Aid</h1>
          <p className="lead mt-3">
            Smart legal assistance, case management, and document automation — all in one platform.
          </p>

          <div className="mt-4">
            <Link to="/auth" className="btn btn-primary btn-lg me-3">
              Get Started
            </Link>
            <Link to="/client/chat" className="btn btn-outline-light btn-lg">
              Try Chatbot
            </Link>
          </div>
        </div>
      </div>

      {/* FEATURES SECTION */}
      <div className="container py-5">
        <div className="text-center mb-5">
          <h2 className="fw-bold">What You Can Do</h2>
          <p className="text-muted">
            Powerful tools to simplify your legal experience
          </p>
        </div>

        <div className="row g-4">
          {/* Chatbot */}
          <FeatureCard
            icon="bi-robot"
            title="AI Chat Assistant"
            text="Get instant legal guidance and answers."
          />

          {/* Case Management */}
          <FeatureCard
            icon="bi-folder"
            title="Case Management"
            text="Track and manage your legal cases."
          />

          {/* Case Library */}
          <FeatureCard
            icon="bi-book"
            title="Case Library"
            text="Access past cases and legal references."
          />

          {/* Documents */}
          <FeatureCard
            icon="bi-file-earmark-text"
            title="Document Generator"
            text="Create legal documents in minutes."
          />
        </div>
      </div>

      {/* CTA SECTION */}
      <div className="bg-light py-5 text-center">
        <div className="container">
          <h3 className="fw-bold">Start Using AI Legal Aid Today</h3>
          <p className="text-muted mt-2">
            Sign in to manage your cases or get instant legal help.
          </p>

          <Link to="/auth" className="btn btn-dark btn-lg mt-3">
            Login / Register
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-dark text-white text-center py-3">
        <small>© {new Date().getFullYear()} AI Legal Aid. All rights reserved.</small>
      </footer>
    </>
  );
};

// 🔹 Reusable Feature Card
const FeatureCard = ({ icon, title, text, link }) => {
  return (
    <div className="col-md-6 col-lg-3">
      <div className="card h-100 shadow-sm border-0 text-center">
        <div className="card-body">
          <i className={`bi ${icon} fs-1 text-primary mb-3`}></i>
          <h5 className="fw-bold">{title}</h5>
          <p className="text-muted">{text}</p>
        </div>
      </div>
    </div>
  );
};

export default Home;