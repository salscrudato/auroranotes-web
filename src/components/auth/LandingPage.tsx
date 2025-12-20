/**
 * LandingPage - Beautiful authentication landing page
 * Shows when users are not authenticated
 */

import { useState, useCallback, memo } from 'react';
import {
  Sparkles, Brain, MessageSquare, Search,
  Loader2, ArrowRight, Lock, Lightbulb
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { GoogleIcon } from './GoogleIcon';
import { HowItWorks } from '../landing/HowItWorks';

// Feature cards data
const features = [
  {
    icon: Lightbulb,
    title: 'Total Recall',
    description: 'Capture thoughts, ideas, and information. AuroraNotes remembers everything so you don\'t have to.',
  },
  {
    icon: MessageSquare,
    title: 'Just Ask',
    description: 'Ask questions in plain English. Get clear answers pulled directly from your notes, with sources you can verify.',
  },
  {
    icon: Search,
    title: 'Search by Meaning',
    description: 'Forget keywords. Search by what you mean, not what you typed. Find notes you didn\'t even know you had.',
  },
  {
    icon: Lock,
    title: 'Your Data, Protected',
    description: 'Your notes are encrypted and private. We never train on your data or share it with anyone.',
  },
];

export const LandingPage = memo(function LandingPage() {
  const { signInWithGoogle, error, clearError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true);
    clearError();
    try {
      await signInWithGoogle();
    } catch {
      // Error handled by AuthProvider
    } finally {
      setLoading(false);
    }
  }, [signInWithGoogle, clearError]);

  return (
    <div className="landing-page">
      {/* Gradient background orbs */}
      <div className="landing-bg-orb landing-bg-orb-1" aria-hidden="true" />
      <div className="landing-bg-orb landing-bg-orb-2" aria-hidden="true" />

      <div className="landing-content">
        {/* Hero Section */}
        <header className="landing-hero">
          <div className="landing-logo">
            <Sparkles size={32} />
          </div>
          <h1 className="landing-title">
            Your notes,
            <span className="landing-title-accent"> brilliantly searchable</span>
          </h1>
          <p className="landing-subtitle">
            AuroraNotes uses AI to let you ask questions about your notes
            and get answers with cited sources. Like having a perfect memory.
          </p>

          {/* CTA Section */}
          <div className="landing-cta">
            <button
              className="landing-google-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
              type="button"
            >
              <span className="landing-google-icon">
                {loading ? <Loader2 size={22} className="spinner" /> : <GoogleIcon size={22} />}
              </span>
              <span className="landing-google-text">
                {loading ? 'Signing in...' : 'Continue with Google'}
              </span>
              <ArrowRight size={18} className="landing-google-arrow" />
            </button>

            {error && (
              <p className="landing-error">{error.message}</p>
            )}

            <p className="landing-cta-hint">
              Free to use • No credit card required
            </p>
          </div>
        </header>

        {/* Features Grid */}
        <section className="landing-features">
          <h2 className="landing-section-title">
            <Brain size={20} />
            Why AuroraNotes
          </h2>
          <div className="landing-features-grid">
            {features.map((feature, i) => (
              <div key={i} className="landing-feature-card">
                <div className="landing-feature-icon">
                  <feature.icon size={22} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Demo/Preview Section */}
        <section className="landing-demo">
          <div className="landing-demo-window">
            <div className="landing-demo-header">
              <div className="landing-demo-dots">
                <span /><span /><span />
              </div>
              <span className="landing-demo-title">AuroraNotes AI</span>
            </div>
            <div className="landing-demo-content">
              <div className="landing-demo-message landing-demo-user">
                <MessageSquare size={16} />
                <span>What did we decide about the database migration?</span>
              </div>
              <div className="landing-demo-message landing-demo-ai">
                <Sparkles size={16} />
                <div>
                  <p>Based on your notes, the team decided to migrate from Firestore to PostgreSQL for analytics data in Q2 2025 <span className="landing-demo-cite">[1]</span>. Firestore will remain the primary database for notes storage.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-page-footer">
          <p>Built with Gemini 2.0 Flash • Vertex AI Embeddings • Cloud Run</p>
          <button
            className="landing-how-it-works-link"
            onClick={() => setShowHowItWorks(true)}
            type="button"
          >
            How It Works
          </button>
        </footer>
      </div>

      {/* How It Works Modal */}
      {showHowItWorks && (
        <div className="how-it-works-modal-overlay">
          <HowItWorks onClose={() => setShowHowItWorks(false)} />
        </div>
      )}
    </div>
  );
});

