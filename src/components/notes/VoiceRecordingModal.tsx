/**
 * VoiceRecordingModal - Full-screen modal for voice recording with live transcription
 * Premium Apple-inspired UI with sophisticated animations and micro-interactions
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Loader2, Send, ChevronDown } from 'lucide-react';
import { cn, formatTime, triggerHaptic } from '@/lib/utils';
import { useSpeechToText } from '@/hooks/useSpeechToText';

interface VoiceRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
}

// Audio waveform visualization component
const AudioWaveform = memo(function AudioWaveform({ isActive }: { isActive: boolean }) {
  const bars = 5;
  return (
    <div className="voice-modal-waveform" aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'voice-modal-waveform-bar',
            isActive && 'active'
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            height: isActive ? undefined : '4px'
          }}
        />
      ))}
    </div>
  );
});

export const VoiceRecordingModal = memo(function VoiceRecordingModal({
  isOpen,
  onClose,
  onSubmit,
}: VoiceRecordingModalProps) {
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  const {
    state: recordingState,
    startRecording,
    stopRecording,
    cancelRecording,
    confirmTranscription,
    duration,
    transcript,
    rawTranscript,
    error: speechError,
    isSupported,
  } = useSpeechToText({
    onError: useCallback((msg: string) => {
      console.error('Speech error:', msg);
      triggerHaptic('heavy');
    }, []),
    autoEnhance: false,
  });

  // Use transcript during recording (live), rawTranscript after stopping
  const displayText = recordingState === 'recording' ? transcript : rawTranscript;

  const isRecording = recordingState === 'recording';
  const isPreviewing = recordingState === 'preview' || recordingState === 'enhancing';

  // Check if transcript needs scrolling
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) {
      setShowScrollHint(el.scrollHeight > el.clientHeight);
    }
  }, [displayText]);

  // Auto-start recording when modal opens
  useEffect(() => {
    if (isOpen && recordingState === 'idle') {
      startRecording();
    }
  }, [isOpen, recordingState, startRecording]);

  // Handle close - cancel recording if active
  const handleClose = useCallback(() => {
    triggerHaptic('light');
    if (isRecording || isPreviewing) {
      cancelRecording();
    }
    onClose();
  }, [isRecording, isPreviewing, cancelRecording, onClose]);

  // Stop recording
  const handleStopRecording = useCallback(async () => {
    triggerHaptic('medium');
    await stopRecording();
  }, [stopRecording]);

  // Submit the note
  const handleSubmit = useCallback(async () => {
    if (isSubmittingRef.current || !rawTranscript.trim()) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    triggerHaptic('medium');

    try {
      await onSubmit(rawTranscript.trim());
      triggerHaptic('medium');
      confirmTranscription();
      onClose();
    } catch {
      triggerHaptic('heavy');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [rawTranscript, onSubmit, confirmTranscription, onClose]);

  if (!isOpen) return null;

  return (
    <div className="voice-modal-overlay">
      {/* Ambient glow effect */}
      <div className={cn(
        'voice-modal-ambient',
        isRecording && 'recording',
        isPreviewing && 'preview'
      )} />

      {/* Header */}
      <header className="voice-modal-header">
        <button
          type="button"
          onClick={handleClose}
          className="voice-modal-cancel-btn"
        >
          Cancel
        </button>
        <div className="voice-modal-status">
          <span className={cn(
            'voice-modal-status-dot',
            isRecording && 'recording',
            isPreviewing && 'ready'
          )} />
          <span className="voice-modal-status-text">
            {isRecording ? 'Recording' : isPreviewing ? 'Ready to save' : 'Preparing...'}
          </span>
        </div>
        <div className="w-16" />
      </header>

      {/* Main content */}
      <main className="voice-modal-content">
        {/* Recording indicator */}
        <div className="voice-modal-indicator-section">
          <div className="voice-modal-indicator-wrapper">
            {/* Outer ripple rings */}
            {isRecording && (
              <>
                <div className="voice-modal-ripple voice-modal-ripple-1" />
                <div className="voice-modal-ripple voice-modal-ripple-2" />
                <div className="voice-modal-ripple voice-modal-ripple-3" />
              </>
            )}

            {/* Main indicator circle */}
            <div className={cn(
              'voice-modal-indicator',
              isRecording && 'recording',
              isPreviewing && 'preview'
            )}>
              {isRecording ? (
                <Mic size={40} className="voice-modal-indicator-icon" strokeWidth={1.5} />
              ) : isPreviewing ? (
                <Send size={32} className="voice-modal-indicator-icon" strokeWidth={1.5} />
              ) : (
                <Loader2 size={32} className="voice-modal-indicator-icon animate-spin" strokeWidth={1.5} />
              )}
            </div>
          </div>

          {/* Duration display */}
          <div className="voice-modal-duration">
            <span className="voice-modal-duration-time">{formatTime(duration)}</span>
            {isRecording && (
              <AudioWaveform isActive={isRecording} />
            )}
          </div>
        </div>

        {/* Transcription card */}
        <div className="voice-modal-transcript-section">
          <div className="voice-modal-transcript-header">
            <span className="voice-modal-transcript-label">Transcription</span>
            {isRecording && (
              <span className="voice-modal-live-badge">
                <span className="voice-modal-live-dot" />
                Live
              </span>
            )}
          </div>

          <div
            ref={transcriptRef}
            className={cn(
              'voice-modal-transcript-card',
              isRecording && 'recording'
            )}
          >
            {speechError ? (
              <p className="voice-modal-transcript-error">{speechError}</p>
            ) : !isSupported ? (
              <p className="voice-modal-transcript-warning">
                Speech recognition is not supported in this browser. Please use Chrome or Safari.
              </p>
            ) : displayText ? (
              <p className="voice-modal-transcript-text">
                {displayText}
                {isRecording && <span className="voice-modal-cursor" />}
              </p>
            ) : (
              <p className="voice-modal-transcript-placeholder">
                {isRecording ? 'Listening...' : 'Your transcription will appear here'}
              </p>
            )}
          </div>

          {showScrollHint && (
            <div className="voice-modal-scroll-hint">
              <ChevronDown size={16} />
            </div>
          )}
        </div>
      </main>

      {/* Bottom actions */}
      <footer className="voice-modal-footer">
        {isRecording ? (
          <div className="voice-modal-stop-section">
            <button
              type="button"
              onClick={handleStopRecording}
              className="voice-modal-stop-btn"
              aria-label="Stop recording"
            >
              <span className="voice-modal-stop-icon" />
            </button>
            <span className="voice-modal-stop-hint">Tap to finish</span>
          </div>
        ) : isPreviewing && rawTranscript.trim() ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={cn(
              'voice-modal-save-btn',
              isSubmitting && 'submitting'
            )}
            aria-label="Save note"
          >
            {isSubmitting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <Send size={18} strokeWidth={2} />
                <span>Save Note</span>
              </>
            )}
          </button>
        ) : !isRecording && !isPreviewing ? (
          <div className="voice-modal-preparing">
            <Loader2 size={20} className="animate-spin text-white/40" />
            <span>Preparing microphone...</span>
          </div>
        ) : null}
      </footer>
    </div>
  );
});

