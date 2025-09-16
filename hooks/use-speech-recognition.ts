import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  isLoading: boolean;
  transcript: string;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  clearTranscript: () => void;
  isSupported: boolean;
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const pcmBuffersRef = useRef<Float32Array[]>([]);

  // Check if capture APIs are supported
  useEffect(() => {
    const checkSupport = async () => {
      try {
        const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        if (hasMediaDevices) {
          setIsSupported(true);
        } else {
          setIsSupported(false);
          setError('Speech capture not supported in this browser');
        }
      } catch (err) {
        setIsSupported(false);
        setError('Failed to check audio capture support');
      }
    };

    checkSupport();
  }, []);

  // Simple linear resampler to 16kHz mono
  function resampleTo16k(input: Float32Array, inRate: number): Float32Array {
    const outRate = 16000;
    if (inRate === outRate) return input;
    const ratio = outRate / inRate;
    const outLength = Math.floor(input.length * ratio);
    const out = new Float32Array(outLength);
    for (let i = 0; i < outLength; i++) {
      const srcIndex = i / ratio;
      const i0 = Math.floor(srcIndex);
      const i1 = Math.min(i0 + 1, input.length - 1);
      const t = srcIndex - i0;
      out[i] = (1 - t) * input[i0] + t * input[i1];
    }
    return out;
  }

  // Encode PCM float [-1,1] into 16-bit mono WAV
  function encodeWAV(samples: Float32Array, sampleRate = 16000): Blob {
    const bytesPerSample = 2;
    const blockAlign = 1 * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    function writeString(offset: number, str: string) {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    }

    // RIFF header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');

    // fmt chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // channels: mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // bits per sample

    // data chunk
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // PCM samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  // Helper to upload recorded audio to /api/stt
  const uploadAudio = useCallback(async (blob: Blob) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[STT] Uploading audio blob', { size: blob.size, type: blob.type });
      const form = new FormData();
      form.append('audio', blob, 'recording.wav');
      const res = await fetch('/api/stt', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('[STT] Backend error', res.status, text);
        setError(text || `STT API error ${res.status}`);
        throw new Error(`STT API error ${res.status}: ${text || 'Unknown error'}`);
      }
      const data = await res.json();
      const text = (data && (data.transcript || data.text)) || '';
      console.log('[STT] Response', data);
      // Emit only the latest chunk; the consumer decides how to append
      if (text) setTranscript(text);
    } catch (e) {
      console.error('Upload/STT error:', e);
      if (!error) setError('Speech-to-text failed. See console for details.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Start listening with comprehensive error handling
  const startListening = useCallback(async () => {
    if (!isSupported || isListening) return;

    try {
      setIsListening(true);
      isListeningRef.current = true;
      setError(null);
      setTranscript('');
      console.log('[STT] startListening');
      
      // Get user media (mono)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      mediaStreamRef.current = stream;

      // Use Web Audio to capture raw PCM
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextCtor();
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === 'suspended') {
        try { await audioCtx.resume(); } catch {}
      }
      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      // Load our recorder worklet and route audio through it
      await audioCtx.audioWorklet.addModule('/worklets/recorder-processor.js');
      const node = new AudioWorkletNode(audioCtx, 'recorder-processor');
      workletNodeRef.current = node;
      pcmBuffersRef.current = [];
      node.port.onmessage = (event) => {
        if (!isListeningRef.current) return;
        const chunk = event.data as Float32Array;
        if ((chunk as any)?.heartbeat) {
          // heartbeat for diagnostics; ignore
          return;
        }
        if (chunk && (chunk as Float32Array).length) {
          pcmBuffersRef.current.push(new Float32Array(chunk));
        }
      };
      source.connect(node);
      node.connect(audioCtx.destination);

      // Recording continues until user stops

    } catch (err) {
      setIsListening(false);
      isListeningRef.current = false;
      const errorMessage = err instanceof Error ? err.message : 'Failed to start speech recognition';
      console.error('Error starting speech recognition:', err);
      
      if (errorMessage.includes('permission')) {
        setError('Microphone permission denied. Please allow microphone access.');
      } else {
        setError(`Failed to start recording: ${errorMessage}`);
      }
    }
  }, [isSupported, isListening, uploadAudio]);

  // Stop listening with proper cleanup
  const stopListening = useCallback(() => {
    if (!isListening) return;

    try {
      console.log('[STT] stopListening. Collected chunks:', pcmBuffersRef.current.length);
      // Stop audio graph
      try { workletNodeRef.current?.disconnect(); } catch {}
      try { sourceRef.current?.disconnect(); } catch {}
      // Stop all tracks
      mediaStreamRef.current?.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
      try { audioCtxRef.current?.close(); } catch {}

      // Build WAV and upload
      const sampleRate = audioCtxRef.current?.sampleRate || 48000;
      const totalLen = pcmBuffersRef.current.reduce((a, b) => a + b.length, 0);
      const merged = new Float32Array(totalLen);
      let offset = 0;
      for (const chunk of pcmBuffersRef.current) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      console.log('[STT] Building WAV', { sampleRate, totalLen, buffers: pcmBuffersRef.current.length });
      const resampled = resampleTo16k(merged, sampleRate);
      // Simple normalization: target RMS ~0.1, limit peak to 0.99
      let rms = 0;
      for (let i = 0; i < resampled.length; i++) rms += resampled[i] * resampled[i];
      rms = Math.sqrt(rms / Math.max(1, resampled.length));
      const targetRms = 0.1;
      const gain = rms > 0 ? Math.min(0.99, targetRms / rms) : 1;
      const normalized = new Float32Array(resampled.length);
      for (let i = 0; i < resampled.length; i++) {
        const v = resampled[i] * gain;
        normalized[i] = Math.max(-0.99, Math.min(0.99, v));
      }
      const wavBlob = encodeWAV(normalized, 16000);
      pcmBuffersRef.current = [];
      uploadAudio(wavBlob);

      setIsListening(false);
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
      setError('Failed to stop speech recognition');
      setIsListening(false);
    }
  }, [isListening]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch {}
      try {
        mediaStreamRef.current?.getTracks().forEach(t => t.stop());
      } catch {}
    };
  }, [isListening]);

  return {
    isListening,
    isLoading,
    transcript,
    error,
    startListening,
    stopListening,
    clearTranscript,
    isSupported,
  };
};
