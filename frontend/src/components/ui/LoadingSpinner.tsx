import { cn } from '@/utils/cn'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const LoadingSpinner = ({ className, size = 'md' }: LoadingSpinnerProps) => {
  let spinnerSize = 'h-6 w-6'
  if (size === 'sm') spinnerSize = 'h-4 w-4'
  if (size === 'lg') spinnerSize = 'h-8 w-8'

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('animate-spin rounded-full border-b-2 border-primary-600', spinnerSize)}></div>
    </div>
  )
}
