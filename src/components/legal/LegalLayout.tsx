/**
 * LegalLayout - Shared layout component for legal pages (Terms, Privacy)
 * Provides consistent styling and navigation for legal documents
 */

import { memo, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export const LegalLayout = memo(function LegalLayout({
  title,
  lastUpdated,
  children,
}: LegalLayoutProps) {
  const handleBack = () => {
    // Navigate back to home/landing
    window.history.back();
  };

  return (
    <div className="legal-page">
      <div className="legal-container">
        <header className="legal-header">
          <button
            type="button"
            onClick={handleBack}
            className="legal-back-btn"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="legal-logo">
            <img src="/favicon.svg" alt="AuroraNotes" className="legal-favicon" />
            <span className="legal-logo-text">AuroraNotes</span>
          </div>
        </header>

        <main className="legal-content">
          <h1 className="legal-title">{title}</h1>
          <p className="legal-updated">Last Updated: {lastUpdated}</p>
          
          <div className="legal-body">
            {children}
          </div>
        </main>

        <footer className="legal-footer">
          <p>© {new Date().getFullYear()} AuroraNotes. All rights reserved.</p>
          <div className="legal-footer-links">
            <a href="/terms">Terms of Service</a>
            <span className="legal-footer-divider">•</span>
            <a href="/privacy">Privacy Policy</a>
          </div>
        </footer>
      </div>
    </div>
  );
});

