/**
 * Privacy Policy Page for AuroraNotes
 * Comprehensive privacy policy covering data collection, AI processing, and user rights
 */

import { memo } from 'react';
import { LegalLayout } from './LegalLayout';

const LAST_UPDATED = 'December 24, 2024';

export const PrivacyPolicy = memo(function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <section className="legal-section">
        <h2>Introduction</h2>
        <p>
          AuroraNotes ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
          explains how we collect, use, disclose, and safeguard your information when you use our 
          AI-powered note-taking service ("Service").
        </p>
        <p>
          By using the Service, you consent to the data practices described in this Privacy Policy. 
          If you do not agree with these practices, please do not use the Service.
        </p>
      </section>

      <section className="legal-section">
        <h2>1. Information We Collect</h2>
        
        <h3>1.1 Account Information</h3>
        <p>When you create an account, we collect:</p>
        <ul>
          <li><strong>Google Sign-In:</strong> Email address, display name, and profile picture</li>
          <li><strong>Phone Sign-In:</strong> Phone number for verification purposes</li>
          <li><strong>User ID:</strong> A unique identifier for your account</li>
        </ul>

        <h3>1.2 User Content</h3>
        <p>We collect and store the content you create, including:</p>
        <ul>
          <li>Notes (text, titles, and tags)</li>
          <li>Chat messages and conversation history</li>
          <li>Voice recordings (temporarily, for transcription)</li>
          <li>Feedback and ratings you provide</li>
        </ul>

        <h3>1.3 Automatically Collected Information</h3>
        <p>We automatically collect certain information when you use the Service:</p>
        <ul>
          <li>Device type and browser information</li>
          <li>IP address and approximate location</li>
          <li>Usage patterns and feature interactions</li>
          <li>Error logs and performance data</li>
          <li>Request timestamps and session duration</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>2. How We Use Your Information</h2>
        <p>We use your information for the following purposes:</p>
        
        <h3>2.1 Providing the Service</h3>
        <ul>
          <li>Store and retrieve your notes</li>
          <li>Generate AI-powered chat responses based on your notes</li>
          <li>Transcribe voice recordings to text</li>
          <li>Create searchable indexes of your content</li>
          <li>Generate summaries, action items, and insights from your notes</li>
        </ul>

        <h3>2.2 AI Processing</h3>
        <p>
          <strong>Important:</strong> Your notes and chat messages are processed by AI systems to provide 
          core features. This includes:
        </p>
        <ul>
          <li><strong>Embeddings:</strong> Converting your text into numerical representations for semantic search</li>
          <li><strong>Chat Responses:</strong> Sending your questions and relevant note excerpts to AI models</li>
          <li><strong>Transcription:</strong> Processing audio through AI speech-to-text services</li>
          <li><strong>Enrichment:</strong> Extracting titles, summaries, and action items using AI</li>
        </ul>

        <h3>2.3 Service Improvement</h3>
        <ul>
          <li>Analyze usage patterns to improve features</li>
          <li>Debug issues and maintain service reliability</li>
          <li>Develop new features based on user needs</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>3. Data Sharing and Third Parties</h2>
        <p>We share your data with the following third-party service providers:</p>
        
        <h3>3.1 Google Cloud Platform</h3>
        <ul>
          <li><strong>Firebase Authentication:</strong> Manages user sign-in and identity</li>
          <li><strong>Cloud Firestore:</strong> Stores your notes and account data</li>
          <li><strong>Cloud Run:</strong> Hosts our backend services</li>
        </ul>

        <h3>3.2 Google AI Services</h3>
        <ul>
          <li><strong>Gemini/Vertex AI:</strong> Powers chat responses, transcription, and content analysis</li>
          <li>Your content is sent to these services for processing</li>
          <li>Google's AI services may retain data as per their data usage policies</li>
        </ul>

        <h3>3.3 Legal Requirements</h3>
        <p>
          We may disclose your information if required by law, court order, or government request, 
          or to protect our rights, property, or safety.
        </p>

        <h3>3.4 No Sale of Data</h3>
        <p>
          <strong>We do not sell your personal information to third parties.</strong>
        </p>
      </section>

      <section className="legal-section">
        <h2>4. Data Storage and Security</h2>
        
        <h3>4.1 Storage Location</h3>
        <p>
          Your data is stored on Google Cloud Platform infrastructure located in the United States. 
          By using the Service, you consent to the transfer of your data to the United States.
        </p>

        <h3>4.2 Security Measures</h3>
        <p>We implement industry-standard security measures including:</p>
        <ul>
          <li>Encryption in transit (TLS/HTTPS)</li>
          <li>Encryption at rest for stored data</li>
          <li>Firebase Authentication for secure access</li>
          <li>Per-user data isolation (tenantId-based access control)</li>
          <li>Rate limiting to prevent abuse</li>
          <li>Regular security reviews and updates</li>
        </ul>

        <h3>4.3 Data Retention</h3>
        <p>We retain your data as follows:</p>
        <ul>
          <li><strong>Account data:</strong> Until you delete your account</li>
          <li><strong>Notes and content:</strong> Until you delete them or your account</li>
          <li><strong>Voice recordings:</strong> Processed immediately and not retained after transcription</li>
          <li><strong>Logs and analytics:</strong> Up to 90 days for operational purposes</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>5. Your Rights and Choices</h2>

        <h3>5.1 Access and Export</h3>
        <p>
          You can access all your notes and data through the Service at any time.
          You may request a copy of your data by contacting us.
        </p>

        <h3>5.2 Deletion</h3>
        <p>You have the right to:</p>
        <ul>
          <li>Delete individual notes at any time through the Service</li>
          <li>Request complete account deletion by contacting us</li>
          <li>Upon account deletion, all your data will be permanently removed within 30 days</li>
        </ul>

        <h3>5.3 Opt-Out</h3>
        <p>
          Certain features (like AI chat) require data processing to function. If you do not wish
          to have your data processed by AI systems, you may choose not to use those features,
          but the core Service requires AI processing to function.
        </p>

        <h3>5.4 California Privacy Rights (CCPA)</h3>
        <p>If you are a California resident, you have the right to:</p>
        <ul>
          <li>Know what personal information we collect and how it's used</li>
          <li>Request deletion of your personal information</li>
          <li>Opt-out of the sale of personal information (we do not sell data)</li>
          <li>Non-discrimination for exercising your privacy rights</li>
        </ul>

        <h3>5.5 European Privacy Rights (GDPR)</h3>
        <p>If you are in the European Economic Area, you have additional rights:</p>
        <ul>
          <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
          <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
          <li><strong>Right to Erasure:</strong> Request deletion of your data</li>
          <li><strong>Right to Portability:</strong> Receive your data in a structured format</li>
          <li><strong>Right to Object:</strong> Object to certain processing activities</li>
          <li><strong>Right to Restrict:</strong> Request limitation of data processing</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>6. Cookies and Tracking</h2>
        <p>We use minimal cookies and tracking technologies:</p>
        <ul>
          <li><strong>Authentication cookies:</strong> To keep you signed in (essential)</li>
          <li><strong>Session storage:</strong> For app state management (essential)</li>
          <li><strong>No advertising cookies:</strong> We do not use advertising or tracking cookies</li>
          <li><strong>No third-party analytics:</strong> We do not use Google Analytics or similar services</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>7. Children's Privacy</h2>
        <p>
          The Service is not intended for children under 13 years of age. We do not knowingly
          collect personal information from children under 13. If you are a parent or guardian
          and believe your child has provided us with personal information, please contact us
          immediately, and we will delete such information.
        </p>
      </section>

      <section className="legal-section">
        <h2>8. Voice Recording Consent</h2>
        <p>
          When you use the voice recording feature:
        </p>
        <ul>
          <li>You expressly consent to microphone access on your device</li>
          <li>Audio is recorded locally and transmitted securely to our servers</li>
          <li>AI processes the audio to generate text transcription</li>
          <li>Audio data is deleted immediately after processing</li>
          <li>Only the text transcription is stored (if you choose to save it)</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>9. AI and Machine Learning</h2>
        <p>
          Your data helps power the AI features of the Service. We want to be transparent:
        </p>
        <ul>
          <li>Your notes are used to generate personalized AI responses</li>
          <li>Content is processed by Google's AI services (Gemini/Vertex AI)</li>
          <li>We create embeddings (numerical representations) of your text for search</li>
          <li>AI-generated content may be stored with your notes (summaries, action items)</li>
          <li>We do not use your data to train general AI models</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of material
          changes by posting the new Privacy Policy on this page and updating the "Last Updated"
          date. We encourage you to review this Privacy Policy periodically.
        </p>
      </section>

      <section className="legal-section">
        <h2>11. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, wish to exercise your privacy rights,
          or have concerns about your data, please contact us at:
        </p>
        <p className="legal-contact">
          <strong>Email:</strong> privacy@auroranotes.app
        </p>
        <p>
          We will respond to your request within 30 days.
        </p>
      </section>
    </LegalLayout>
  );
});

