import React, { useState, useEffect } from 'react'
import { ClockIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils/cn'

interface ExamTimerProps {
  timeRemaining: number // 剩余秒数
  onTimeUp: () => void
  warningThreshold?: number // 警告阈值（秒）
}

export const ExamTimer: React.FC<ExamTimerProps> = ({
  timeRemaining: initialTime,
  onTimeUp,
  warningThreshold = 300, // 5分钟警告
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime)

  useEffect(() => {
    setTimeLeft(initialTime)
  }, [initialTime])

  useEffect(() => {
    if (timeLeft <= 0) {
      // onTimeUp(); // This might be called multiple times if not cleared
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1
        if (newTime <= 0) {
          clearInterval(timer); 
          onTimeUp(); // Call onTimeUp only when time actually reaches zero
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]); // timeLeft dependency ensures timer restarts if initialTime changes externally

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const isWarning = timeLeft <= warningThreshold && timeLeft > 60
  const isCritical = timeLeft <= 60

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-sm',
      isCritical ? 'bg-red-100 text-red-700 animate-pulse' :
      isWarning ? 'bg-orange-100 text-orange-700' :
      'bg-gray-100 text-gray-700'
    )}>
      <ClockIcon className="h-4 w-4" />
      <span className="font-medium">
        剩余时间: {formatTime(timeLeft)}
      </span>
      {isCritical && timeLeft > 0 && ( // Only show if time is critical AND not yet zero
        <span className="text-xs">即将结束!</span>
      )}
      {timeLeft <= 0 && (
         <span className="text-xs font-semibold text-red-700">时间已到!</span>
      )}
    </div>
  )
}
