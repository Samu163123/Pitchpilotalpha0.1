interface AudioMeterProps {
  isActive: boolean
}

export function AudioMeter({ isActive }: AudioMeterProps) {
  return (
    <div className="flex items-center space-x-1">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-primary rounded-full transition-all duration-150 ${
            isActive ? "animate-waveform h-4" : "h-2 opacity-30"
          }`}
          style={{
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  )
}
