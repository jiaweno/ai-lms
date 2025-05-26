import React from 'react'
import { cn } from '@/utils/cn'

interface ProgressBarProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
  showLabel?: boolean
  labelSuffix?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  color, // Custom color Tailwind class e.g., 'bg-green-500'
  className,
  showLabel = false,
  labelSuffix = '%',
}) => {
  const percent = max === 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100))

  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-800">
            {Math.round(percent)}{labelSuffix}
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full bg-gray-200 rounded-full overflow-hidden',
          heightClasses[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            color || 'bg-primary-600' // Default to primary color
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
