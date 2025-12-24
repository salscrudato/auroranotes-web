/**
 * useSpeechToText - Speech-to-text hook with real-time transcription and AI enhancement
 *
 * Uses Web Speech API for real-time transcription and MediaRecorder for audio playback.
 * Shows transcript instantly as user speaks, then enhances with AI for better quality.
 * Features:
 * - Real-time transcription via Web Speech API
 * - Audio recording for playback preview
 * - AI enhancement via Gemini (fixes grammar, removes filler words, adds punctuation)
 * - Streaming enhancement with visible token-by-token updates
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { enhanceTranscript } from '../lib/api';

export type RecordingState = 'idle' | 'recording' | 'enhancing' | 'preview';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface UseSpeechToTextOptions {
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Whether to auto-enhance transcript after recording (default: true) */
  autoEnhance?: boolean;
}

export interface UseSpeechToTextReturn {
  /** Current recording state */
  state: RecordingState;
  /** Whether the browser supports speech recognition */
  isSupported: boolean;
  /** Start recording audio */
  startRecording: () => Promise<void>;
  /** Stop recording and enter preview mode */
  stopRecording: () => Promise<void>;
  /** Cancel recording or preview */
  cancelRecording: () => void;
  /** Confirm the transcript and return it */
  confirmTranscription: () => void;
  /** Play the recorded audio preview */
  playPreview: () => void;
  /** Pause the audio preview */
  pausePreview: () => void;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Recording duration in seconds */
  duration: number;
  /** Current playback position in seconds */
  currentTime: number;
  /** Current transcript text (editable) - shows enhanced version when available */
  transcript: string;
  /** Update the transcript text */
  setTranscript: (text: string) => void;
  /** Original raw transcript before AI enhancement */
  rawTranscript: string;
  /** Whether AI enhancement is available (user is authenticated) */
  enhancementAvailable: boolean;
  /** Manually trigger enhancement */
  enhanceNow: () => Promise<void>;
  /** Skip enhancement and use raw transcript */
  skipEnhancement: () => void;
  /** Error message if any */
  error: string | null;
  /** Whether enhancement failed (for retry UI) */
  enhancementFailed: boolean;
}

/**
 * Hook for recording audio and transcribing it to text in real-time with AI enhancement
 */
export function useSpeechToText(options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const { onError, autoEnhance = true } = options;

  const [state, setState] = useState<RecordingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [rawTranscript, setRawTranscript] = useState('');
  const [enhancementFailed, setEnhancementFailed] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null); // Track Object URL to prevent memory leak
  const recordingStartTimeRef = useRef<number>(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const enhanceControllerRef = useRef<AbortController | null>(null);

  // Check browser support for both MediaRecorder and SpeechRecognition
  const SpeechRecognitionAPI = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

  const isSupported = typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined' &&
    !!SpeechRecognitionAPI;

  // Enhancement is available if we have the API configured
  const enhancementAvailable = true; // Will fail gracefully if not authenticated

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Revoke Object URL to prevent memory leak
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
        audioElementRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      if (enhanceControllerRef.current) {
        enhanceControllerRef.current.abort();
        enhanceControllerRef.current = null;
      }
    };
  }, []);

  const cleanupMedia = useCallback(() => {
    // Stop all tracks on the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    if (enhanceControllerRef.current) {
      enhanceControllerRef.current.abort();
      enhanceControllerRef.current = null;
    }
  }, []);

  const cleanupAudio = useCallback(() => {
    // Revoke Object URL to prevent memory leak
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
      audioElementRef.current = null;
    }
    audioBlobRef.current = null;
    setIsPlaying(false);
    setDuration(0);
    setCurrentTime(0);
  }, []);

  const cleanup = useCallback(() => {
    cleanupMedia();
    cleanupAudio();
    setTranscript('');
    setRawTranscript('');
    finalTranscriptRef.current = '';
  }, [cleanupMedia, cleanupAudio]);

  // AI enhancement function - streams enhanced text token by token
  const runEnhancement = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) {
      setState('preview');
      return;
    }

    setState('enhancing');
    setTranscript(''); // Clear to show streaming effect
    setEnhancementFailed(false); // Reset failure state

    // Set a timeout to prevent users getting stuck in enhancing state
    const ENHANCEMENT_TIMEOUT_MS = 15000; // 15 seconds
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isCompleted = false;

    const handleTimeout = () => {
      if (!isCompleted) {
        console.warn('Enhancement timed out, using raw transcript');
        if (enhanceControllerRef.current) {
          enhanceControllerRef.current.abort();
          enhanceControllerRef.current = null;
        }
        setTranscript(text);
        setEnhancementFailed(true);
        setState('preview');
        isCompleted = true;
      }
    };

    timeoutId = setTimeout(handleTimeout, ENHANCEMENT_TIMEOUT_MS);

    try {
      const controller = await enhanceTranscript(text, {
        onToken: (token) => {
          setTranscript(prev => prev + token);
        },
        onComplete: (enhanced) => {
          if (!isCompleted) {
            if (timeoutId) clearTimeout(timeoutId);
            isCompleted = true;
            setTranscript(enhanced);
            setEnhancementFailed(false);
            setState('preview');
          }
        },
        onError: (err) => {
          if (!isCompleted) {
            if (timeoutId) clearTimeout(timeoutId);
            isCompleted = true;
            console.warn('Enhancement failed, using raw transcript:', err);
            // Fall back to raw transcript on error
            setTranscript(text);
            setEnhancementFailed(true);
            setState('preview');
          }
        },
      });
      enhanceControllerRef.current = controller;
    } catch (err) {
      if (!isCompleted) {
        if (timeoutId) clearTimeout(timeoutId);
        isCompleted = true;
        console.warn('Enhancement failed, using raw transcript:', err);
        // Fall back to raw transcript on error
        setTranscript(text);
        setEnhancementFailed(true);
        setState('preview');
      }
    }
  }, []);

  // Skip enhancement and use raw transcript
  const skipEnhancement = useCallback(() => {
    if (enhanceControllerRef.current) {
      enhanceControllerRef.current.abort();
      enhanceControllerRef.current = null;
    }
    setTranscript(rawTranscript);
    if (state === 'enhancing') {
      setState('preview');
    }
  }, [rawTranscript, state]);

  // Manually trigger enhancement
  const enhanceNow = useCallback(async () => {
    if (rawTranscript.trim()) {
      await runEnhancement(rawTranscript);
    }
  }, [rawTranscript, runEnhancement]);

  const startRecording = useCallback(async () => {
    if (!isSupported || !SpeechRecognitionAPI) {
      const msg = 'Speech recognition is not supported in this browser. Please use Chrome or Edge.';
      setError(msg);
      onError?.(msg);
      return;
    }

    // Clean up any previous recording
    cleanup();
    setError(null);

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      streamRef.current = stream;

      // Set up MediaRecorder for audio playback
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Set up SpeechRecognition for real-time transcription
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognitionRef.current = recognition;
      finalTranscriptRef.current = '';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result) {
            const firstAlternative = result[0];
            if (result.isFinal && firstAlternative) {
              finalTranscriptRef.current += firstAlternative.transcript;
            } else if (firstAlternative) {
              interimTranscript += firstAlternative.transcript;
            }
          }
        }

        // Update transcript with final + interim results
        setTranscript(finalTranscriptRef.current + interimTranscript);
      };

      recognition.onerror = (event) => {
        // Ignore 'no-speech' and 'aborted' errors as they're expected
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          const msg = `Speech recognition error: ${event.error}`;
          setError(msg);
          onError?.(msg);
        }
      };

      recognition.onend = () => {
        // Recognition ended - this is normal when we stop it
      };

      // Start both recording and recognition
      recordingStartTimeRef.current = Date.now();
      mediaRecorder.start(100);
      recognition.start();
      setState('recording');
    } catch (err) {
      const msg = err instanceof Error
        ? (err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow microphone access and try again.'
          : err.message)
        : 'Failed to start recording';
      setError(msg);
      onError?.(msg);
      cleanup();
    }
  }, [isSupported, SpeechRecognitionAPI, onError, cleanup]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || state !== 'recording') {
      return;
    }

    // Stop speech recognition first
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = () => {
        // Create blob from chunks
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });

        // Stop media stream but keep the audio blob
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        mediaRecorderRef.current = null;
        chunksRef.current = [];

        // Check if we have audio data
        if (audioBlob.size === 0) {
          const msg = 'No audio recorded';
          setError(msg);
          onError?.(msg);
          setState('idle');
          resolve();
          return;
        }

        // Store the blob for preview
        audioBlobRef.current = audioBlob;

        // Calculate recording duration
        const recordedDuration = (Date.now() - recordingStartTimeRef.current) / 1000;
        setDuration(recordedDuration);

        // Revoke any existing Object URL to prevent memory leak
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }

        // Create audio element for preview with tracked Object URL
        audioUrlRef.current = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrlRef.current);
        audioElementRef.current = audio;

        audio.onloadedmetadata = () => {
          if (audio.duration && isFinite(audio.duration)) {
            setDuration(audio.duration);
          }
        };

        audio.ontimeupdate = () => {
          setCurrentTime(audio.currentTime);
        };

        audio.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };

        // Store raw transcript before enhancement
        const currentTranscript = finalTranscriptRef.current.trim();
        setRawTranscript(currentTranscript);

        // Auto-enhance if enabled and we have text
        if (autoEnhance && currentTranscript) {
          runEnhancement(currentTranscript);
        } else {
          setState('preview');
        }

        resolve();
      };

      mediaRecorder.stop();
    });
  }, [state, onError, autoEnhance, runEnhancement]);

  const playPreview = useCallback(() => {
    if (audioElementRef.current && (state === 'preview' || state === 'enhancing')) {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  }, [state]);

  const pausePreview = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const confirmTranscription = useCallback(() => {
    if (state !== 'preview' && state !== 'enhancing') {
      return;
    }
    // Abort any ongoing enhancement
    if (enhanceControllerRef.current) {
      enhanceControllerRef.current.abort();
      enhanceControllerRef.current = null;
    }
    // Transcript is already in state and editable - just cleanup and return to idle
    // The parent component will use the transcript value
    cleanupAudio();
    setState('idle');
  }, [state, cleanupAudio]);

  const cancelRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    if (enhanceControllerRef.current) {
      enhanceControllerRef.current.abort();
      enhanceControllerRef.current = null;
    }
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    cleanup();
    setState('idle');
    setError(null);
  }, [state, cleanup]);

  return {
    state,
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    confirmTranscription,
    playPreview,
    pausePreview,
    isPlaying,
    duration,
    currentTime,
    transcript,
    setTranscript,
    rawTranscript,
    enhancementAvailable,
    enhanceNow,
    skipEnhancement,
    error,
    enhancementFailed,
  };
}

