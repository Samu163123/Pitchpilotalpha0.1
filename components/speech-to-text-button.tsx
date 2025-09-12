"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { cn } from '@/lib/utils';

interface SpeechToTextButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SpeechToTextButton({ onTranscript, disabled = false, className }: SpeechToTextButtonProps) {
  const {
    isListening,
    isLoading,
    transcript,
    error,
    startListening,
    stopListening,
    clearTranscript,
    isSupported,
  } = useSpeechRecognition();

  const [hasTranscript, setHasTranscript] = useState(false);

  // Handle transcript changes
  useEffect(() => {
    if (transcript && transcript.trim()) {
      setHasTranscript(true);
      onTranscript(transcript.trim());
    }
  }, [transcript, onTranscript]);

  // Clear transcript when stopping
  useEffect(() => {
    if (!isListening && hasTranscript) {
      clearTranscript();
      setHasTranscript(false);
    }
  }, [isListening, hasTranscript, clearTranscript]);

  const handleClick = async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  };

  if (!isSupported) {
    return null; // Don't render if not supported
  }

  const buttonVariant = isListening ? "destructive" : "outline";
  const Icon = isLoading ? Loader2 : isListening ? MicOff : Mic;

  return (
    <div className="relative">
      <Button
        type="button"
        variant={buttonVariant}
        size="icon"
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={cn(
          "transition-all duration-200",
          isListening && "animate-pulse bg-red-500 hover:bg-red-600",
          className
        )}
        title={
          isListening 
            ? "Stop recording" 
            : isLoading 
            ? "Loading speech recognition..." 
            : "Start voice input"
        }
      >
        <Icon 
          className={cn(
            "h-4 w-4",
            isLoading && "animate-spin"
          )} 
        />
      </Button>
      
      {/* Recording indicator */}
      {isListening && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}
      
      {/* Error tooltip */}
      {error && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-red-500 text-white text-xs rounded whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  );
}
