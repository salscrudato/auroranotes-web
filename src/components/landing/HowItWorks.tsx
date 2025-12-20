/**
 * HowItWorks Landing Page
 * Explains how the AuroraNotes AI chatbot backend and RAG process works
 *
 * This is a mostly-static component. We use React.memo to prevent
 * unnecessary re-renders since the content doesn't change.
 */

import { memo } from 'react';
import {
  Sparkles, FileText, Search, Brain, MessageSquare, Database,
  Zap, ArrowRight, CheckCircle, Layers, GitMerge, Shield,
  Clock, Server, Cpu, ArrowDown
} from 'lucide-react';

interface HowItWorksProps {
  onClose?: () => void;
  onEnterApp?: () => void;
}

export const HowItWorks = memo(function HowItWorks({ onClose, onEnterApp }: HowItWorksProps) {
  // Determine if this is the landing page (has onEnterApp) or modal view (has onClose)
  const isLandingPage = !!onEnterApp;

  return (
    <div className="how-it-works-page">
      <div className="how-it-works-container">
        {/* Header */}
        <header className="how-it-works-header">
          <div className="how-it-works-logo">
            <Sparkles size={28} />
          </div>
          <h1>How AuroraNotes AI Works</h1>
          <p className="how-it-works-subtitle">
            Your personal knowledge assistant powered by Retrieval-Augmented Generation (RAG)
          </p>
          {onClose && (
            <button className="btn btn-ghost how-it-works-close" onClick={onClose}>
              Back to App
            </button>
          )}
        </header>

        {/* Hero CTA for landing page */}
        {isLandingPage && (
          <div className="landing-hero-cta">
            <button className="btn btn-primary btn-lg landing-cta-btn" onClick={onEnterApp}>
              <Sparkles size={20} />
              Enter AuroraNotes
              <ArrowRight size={20} />
            </button>
            <p className="landing-cta-hint">Start taking AI-powered notes</p>
          </div>
        )}

        {/* Overview */}
        <section className="how-it-works-intro">
          <h2>Overview</h2>
          <p>
            AuroraNotes stores your notes and lets you ask questions about them using{' '}
            <strong>Retrieval-Augmented Generation (RAG)</strong> — a pattern where the system
            first finds relevant notes, then asks an AI to answer your question using only that context.
          </p>
          <div className="rag-flow">
            <span className="rag-flow-item">Your Question</span>
            <ArrowRight size={16} />
            <span className="rag-flow-item">Find Relevant Notes</span>
            <ArrowRight size={16} />
            <span className="rag-flow-item">AI Generates Answer</span>
            <ArrowRight size={16} />
            <span className="rag-flow-item">Verified Citations</span>
          </div>
        </section>

        {/* Core Technologies */}
        <section className="how-it-works-section">
          <h2><Server size={20} /> Core Technologies</h2>
          <div className="tech-table">
            <div className="tech-row">
              <span className="tech-label">Runtime</span>
              <span className="tech-value">Node.js + TypeScript on Google Cloud Run</span>
            </div>
            <div className="tech-row">
              <span className="tech-label">Database</span>
              <span className="tech-value">Google Firestore (NoSQL document store)</span>
            </div>
            <div className="tech-row">
              <span className="tech-label">Embeddings</span>
              <span className="tech-value">Google Vertex AI (text-embedding-004)</span>
            </div>
            <div className="tech-row">
              <span className="tech-label">Vector Search</span>
              <span className="tech-value">Vertex AI Vector Search / Firestore fallback</span>
            </div>
            <div className="tech-row">
              <span className="tech-label">LLM</span>
              <span className="tech-value">Google Gemini 2.0 Flash</span>
            </div>
          </div>
        </section>

        {/* Data Pipeline */}
        <section className="how-it-works-section">
          <h2><Database size={20} /> The Data Pipeline</h2>
          <p className="section-intro">When you save a note, it goes through several processing stages to become searchable.</p>

          <div className="pipeline-steps">
            <div className="pipeline-step">
              <div className="pipeline-step-header">
                <span className="pipeline-number">1</span>
                <FileText size={18} />
                <h3>Note Storage</h3>
              </div>
              <p>Notes are stored in Firestore with metadata (tenant ID, timestamps) for organization and retrieval.</p>
            </div>

            <div className="pipeline-connector"><ArrowDown size={16} /></div>

            <div className="pipeline-step">
              <div className="pipeline-step-header">
                <span className="pipeline-number">2</span>
                <Layers size={18} />
                <h3>Chunking</h3>
              </div>
              <p>Long notes are split into ~450-character "chunks" at natural boundaries (paragraphs, sentences).
                 Each chunk maintains <strong>75-character overlap</strong> with adjacent chunks for context continuity.</p>
            </div>

            <div className="pipeline-connector"><ArrowDown size={16} /></div>

            <div className="pipeline-step">
              <div className="pipeline-step-header">
                <span className="pipeline-number">3</span>
                <Cpu size={18} />
                <h3>Embedding Generation</h3>
              </div>
              <p>Each chunk is converted to a <strong>768-dimensional vector</strong> using Google's embedding model.
                 This vector captures the semantic meaning — similar ideas produce similar vectors.</p>
            </div>

            <div className="pipeline-connector"><ArrowDown size={16} /></div>

            <div className="pipeline-step">
              <div className="pipeline-step-header">
                <span className="pipeline-number">4</span>
                <Database size={18} />
                <h3>Indexing</h3>
              </div>
              <p>Chunks are stored with: vector embedding (semantic search), extracted terms (keyword search),
                 and position & context (citation accuracy).</p>
            </div>
          </div>
        </section>

        {/* Retrieval Pipeline */}
        <section className="how-it-works-section">
          <h2><Search size={20} /> The Retrieval Pipeline</h2>
          <p className="section-intro">When you ask a question, multiple search strategies work in parallel to find the best matches.</p>

          <div className="retrieval-stages">
            <div className="retrieval-stage">
              <div className="stage-header">
                <span className="stage-badge">Stage 1</span>
                <h3>Query Analysis</h3>
              </div>
              <p>The system analyzes your question to detect:</p>
              <ul>
                <li><strong>Intent</strong> — question, search, summary, brainstorm</li>
                <li><strong>Entities</strong> — names, dates, unique identifiers</li>
                <li><strong>Time constraints</strong> — recent vs. all-time</li>
              </ul>
            </div>

            <div className="retrieval-stage">
              <div className="stage-header">
                <span className="stage-badge">Stage 2</span>
                <h3>Multi-Signal Candidate Retrieval</h3>
              </div>
              <p>Three parallel search strategies run simultaneously:</p>
              <div className="strategy-cards">
                <div className="strategy-card">
                  <Brain size={16} />
                  <strong>Vector Search</strong>
                  <span>Finds semantically similar chunks (meaning match)</span>
                </div>
                <div className="strategy-card">
                  <Search size={16} />
                  <strong>Lexical Search</strong>
                  <span>BM25-style keyword matching (exact term match)</span>
                </div>
                <div className="strategy-card">
                  <Clock size={16} />
                  <strong>Recency Boost</strong>
                  <span>Prioritizes recently-created notes</span>
                </div>
              </div>
            </div>

            <div className="retrieval-stage">
              <div className="stage-header">
                <span className="stage-badge">Stage 3</span>
                <h3>Fusion & Scoring</h3>
              </div>
              <p>Results are merged using <strong>Reciprocal Rank Fusion (RRF)</strong>, combining all signals
                 into a unified score. This ensures both "conceptually similar" and "keyword exact" matches surface.</p>
            </div>

            <div className="retrieval-stage">
              <div className="stage-header">
                <span className="stage-badge">Stage 4</span>
                <h3>Cross-Encoder Reranking</h3>
              </div>
              <p>A neural reranker (Vertex AI) compares each candidate directly against the query for
                 <strong> more accurate relevance scoring</strong> — more expensive but much more precise than embeddings alone.</p>
            </div>

            <div className="retrieval-stage">
              <div className="stage-header">
                <span className="stage-badge">Stage 5</span>
                <h3>MMR Diversity</h3>
              </div>
              <p><strong>Maximal Marginal Relevance</strong> prevents redundancy by penalizing chunks that are
                 too similar to already-selected ones, ensuring diverse coverage of your notes.</p>
            </div>
          </div>
        </section>

        {/* Answer Generation */}
        <section className="how-it-works-section">
          <h2><MessageSquare size={20} /> Answer Generation Pipeline</h2>
          <p className="section-intro">Once relevant chunks are found, the AI generates a grounded, verified response.</p>

          <div className="generation-steps">
            <div className="generation-step">
              <div className="generation-step-icon"><Layers size={20} /></div>
              <div className="generation-step-content">
                <h3>1. Context Assembly</h3>
                <p>Top-ranked chunks are formatted with source IDs ([1], [2], etc.) and packed into the LLM prompt,
                   respecting a ~100K character budget.</p>
              </div>
            </div>

            <div className="generation-step">
              <div className="generation-step-icon"><Zap size={20} /></div>
              <div className="generation-step-content">
                <h3>2. LLM Generation</h3>
                <p>Gemini 2.0 Flash generates an answer with inline citations, following strict instructions:</p>
                <ul>
                  <li><CheckCircle size={14} /> Only cite what's in the sources</li>
                  <li><CheckCircle size={14} /> Use [n] format for citations</li>
                  <li><CheckCircle size={14} /> Admit uncertainty when sources are insufficient</li>
                </ul>
              </div>
            </div>

            <div className="generation-step">
              <div className="generation-step-icon"><Shield size={20} /></div>
              <div className="generation-step-content">
                <h3>3. Citation Validation</h3>
                <p>A multi-stage verification pipeline ensures accuracy:</p>
                <ul>
                  <li><CheckCircle size={14} /> <strong>Text overlap scoring</strong> — does the cited claim appear in the source?</li>
                  <li><CheckCircle size={14} /> <strong>Semantic grounding</strong> — does the claim meaning match the source?</li>
                  <li><CheckCircle size={14} /> <strong>Contradiction detection</strong> — are sources being misrepresented?</li>
                </ul>
                <p className="note">Invalid citations are removed; low-confidence answers are flagged.</p>
              </div>
            </div>

            <div className="generation-step">
              <div className="generation-step-icon"><GitMerge size={20} /></div>
              <div className="generation-step-content">
                <h3>4. Response Post-Processing</h3>
                <ul>
                  <li><CheckCircle size={14} /> Confidence scoring (low/medium/high/very_high)</li>
                  <li><CheckCircle size={14} /> Citation repair (fix broken references)</li>
                  <li><CheckCircle size={14} /> Consistency enforcement (remove orphaned citations)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Architectural Decisions */}
        <section className="how-it-works-section">
          <h2><Cpu size={20} /> Key Architectural Decisions</h2>
          <div className="decisions-grid">
            <div className="decision-card">
              <h4>Synchronous Chunking</h4>
              <p>Notes are immediately searchable with no async lag</p>
            </div>
            <div className="decision-card">
              <h4>Hybrid Retrieval</h4>
              <p>Vector + keyword covers both conceptual and exact matches</p>
            </div>
            <div className="decision-card">
              <h4>Cross-Encoder Reranking</h4>
              <p>Neural reranking dramatically improves precision</p>
            </div>
            <div className="decision-card">
              <h4>Citation Verification</h4>
              <p>Prevents hallucinated sources (common RAG failure mode)</p>
            </div>
            <div className="decision-card">
              <h4>Multi-Tenant Isolation</h4>
              <p>tenantId field enables secure data separation</p>
            </div>
            <div className="decision-card">
              <h4>Chunk Overlap</h4>
              <p>75-char overlap preserves context across chunk boundaries</p>
            </div>
          </div>
        </section>

        {/* Scale Targets */}
        <section className="how-it-works-section scale-section">
          <h2><Zap size={20} /> Scale & Performance</h2>
          <div className="scale-stats">
            <div className="scale-stat">
              <span className="scale-number">100K+</span>
              <span className="scale-label">Notes supported</span>
            </div>
            <div className="scale-stat">
              <span className="scale-number">&lt;1s</span>
              <span className="scale-label">Retrieval latency</span>
            </div>
            <div className="scale-stat">
              <span className="scale-number">~4s</span>
              <span className="scale-label">End-to-end response</span>
            </div>
          </div>
          <p className="scale-note">
            Embedding + retrieval + LLM generation + citation validation
          </p>
        </section>

        {/* Footer CTA for landing page */}
        {isLandingPage && (
          <footer className="landing-footer">
            <button className="btn btn-primary btn-lg landing-cta-btn" onClick={onEnterApp}>
              <Sparkles size={20} />
              Get Started
              <ArrowRight size={20} />
            </button>
          </footer>
        )}
      </div>
    </div>
  );
});
