/**
 * MobileBottomNav - iOS-style bottom tab bar for mobile navigation
 * Features a prominent purple recording button that opens voice recording modal
 */

import { memo, useCallback, useState } from 'react';
import { FileText, Sparkles, Mic } from 'lucide-react';
import { triggerHaptic, cn } from '@/lib/utils';
import { VoiceRecordingModal } from '@/components/notes/VoiceRecordingModal';
import { useToast } from '@/components/common/useToast';

type Tab = 'notes' | 'chat';

interface MobileBottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onCreateNote?: (text: string) => Promise<void>;
}

export const MobileBottomNav = memo(function MobileBottomNav({
  activeTab,
  onTabChange,
  onCreateNote,
}: MobileBottomNavProps) {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTabPress = useCallback((tab: Tab) => {
    if (tab !== activeTab) {
      triggerHaptic('light');
      onTabChange(tab);
    }
  }, [activeTab, onTabChange]);

  const handleRecordPress = useCallback(() => {
    triggerHaptic('medium');
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleSubmit = useCallback(async (text: string) => {
    if (!onCreateNote) return;

    await onCreateNote(text);
    showToast('Voice note saved', 'success');
  }, [onCreateNote, showToast]);

  // Check if speech recognition is supported
  const isSpeechSupported = typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  return (
    <>
      <nav className="mobile-bottom-nav" aria-label="Main navigation">
        <button
          type="button"
          className={cn('mobile-nav-item', activeTab === 'notes' && 'active')}
          onClick={() => handleTabPress('notes')}
          aria-label="Notes"
          aria-current={activeTab === 'notes' ? 'page' : undefined}
        >
          <span className="mobile-nav-icon">
            <FileText size={22} strokeWidth={activeTab === 'notes' ? 2.5 : 2} />
          </span>
          <span className="mobile-nav-label">Notes</span>
        </button>

        {/* iPhone-style Recording Button - opens modal */}
        <button
          type="button"
          className={cn('mobile-record-btn', !isSpeechSupported && 'disabled')}
          onClick={handleRecordPress}
          disabled={!isSpeechSupported}
          aria-label="Record voice note"
        >
          <span className="mobile-record-btn-inner">
            <Mic size={24} />
          </span>
        </button>

        <button
          type="button"
          className={cn('mobile-nav-item', activeTab === 'chat' && 'active')}
          onClick={() => handleTabPress('chat')}
          aria-label="Chat"
          aria-current={activeTab === 'chat' ? 'page' : undefined}
        >
          <span className="mobile-nav-icon">
            <Sparkles size={22} strokeWidth={activeTab === 'chat' ? 2.5 : 2} />
          </span>
          <span className="mobile-nav-label">Chat</span>
        </button>
      </nav>

      {/* Voice Recording Modal */}
      <VoiceRecordingModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleSubmit}
      />
    </>
  );
});
