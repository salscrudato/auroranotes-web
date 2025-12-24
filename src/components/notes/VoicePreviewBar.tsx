/**
 * Audio preview bar with playback controls, editable transcript, and action buttons.
 */

import { memo } from 'react';
import { Play, Pause, Check, X, Sparkles, AlertTriangle, RotateCcw } from 'lucide-react';
import { formatTime } from '../../lib/utils';

interface VoicePreviewBarProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  transcript: string;
  rawTranscript: string;
  isEnhancing: boolean;
  enhancementFailed: boolean;
  onTranscriptChange: (text: string) => void;
  onSkipEnhancement: () => void;
  onEnhanceNow: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const VoicePreviewBar = memo(function VoicePreviewBar({
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  transcript,
  rawTranscript,
  isEnhancing,
  enhancementFailed,
  onTranscriptChange,
  onSkipEnhancement,
  onEnhanceNow,
  onConfirm,
  onCancel,
}: VoicePreviewBarProps) {
  return (
    <div className="audio-preview-container">
      {/* Playback controls */}
      <div className="audio-preview-bar">
        <button
          className="audio-preview-play-btn"
          onClick={isPlaying ? onPause : onPlay}
          aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
          type="button"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <div
          className="audio-preview-progress"
          role="progressbar"
          aria-label="Audio playback progress"
          aria-valuenow={Math.round(currentTime)}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        >
          <div
            className="audio-preview-progress-bar"
            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
        </div>
        <span className="audio-preview-time" aria-hidden="true">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Editable transcript with enhancement status */}
      <div className="audio-preview-transcript">
        {isEnhancing && (
          <div className="enhancement-status">
            <span className="enhancement-badge">
              <Sparkles size={12} />
              AI enhancing...
            </span>
            <button
              className="enhancement-skip-btn"
              onClick={onSkipEnhancement}
              type="button"
            >
              Use original
            </button>
          </div>
        )}
        <textarea
          className={`audio-preview-transcript-input ${isEnhancing ? 'enhancing' : ''}`}
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          placeholder={isEnhancing ? 'Enhancing with AI...' : 'Transcript will appear here...'}
          aria-label="Edit transcript"
          disabled={isEnhancing}
        />
        {rawTranscript && !isEnhancing && transcript !== rawTranscript && (
          <div className="enhancement-comparison">
            <button
              className="enhancement-toggle-btn"
              onClick={() => onTranscriptChange(rawTranscript)}
              type="button"
            >
              Show original
            </button>
          </div>
        )}
        {/* Enhancement failed notice with retry */}
        {enhancementFailed && !isEnhancing && (
          <div className="enhancement-failed-notice">
            <AlertTriangle size={14} />
            <span>AI enhancement failed. Using original transcript.</span>
            <button
              className="btn"
              onClick={onEnhanceNow}
              type="button"
            >
              <RotateCcw size={12} />
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="audio-preview-footer">
        <span className="audio-preview-hint">
          {isEnhancing ? 'AI is cleaning up your transcript...' : 'Edit the transcript above, then confirm or discard'}
        </span>
        <div className="audio-preview-actions">
          <button
            className="audio-preview-cancel-btn"
            onClick={onCancel}
            aria-label="Discard recording"
            title="Discard"
            type="button"
          >
            <X size={16} />
            <span>Discard</span>
          </button>
          <button
            className="audio-preview-confirm-btn"
            onClick={onConfirm}
            disabled={!transcript.trim()}
            aria-label="Add to note"
            title="Add to note"
            type="button"
          >
            <Check size={16} />
            <span>Add to note</span>
          </button>
        </div>
      </div>
    </div>
  );
});
