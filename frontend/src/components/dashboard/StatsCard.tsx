import React from 'react'
import { cn } from '@/utils/cn'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  iconColor?: string
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  className,
  iconColor = 'text-primary-500',
}) => {
  return (
    <div className={cn('bg-white p-6 rounded-lg shadow-sm border border-gray-200', className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
          <div className="mt-1 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {trend && (
              <div className={cn(
                'ml-2 flex items-baseline text-sm font-semibold',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.isPositive ? (
                  <ArrowUpIcon className="h-4 w-4 flex-shrink-0 self-center" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 flex-shrink-0 self-center" />
                )}
                <span className="ml-0.5">{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
        </div>
        <div className={cn('flex-shrink-0 rounded-full p-3 bg-opacity-10', iconColor)}>
          <Icon className={cn('h-6 w-6', iconColor)} aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
