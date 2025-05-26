import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { usePermission } from '@/hooks/useAuth'
import { Alert } from '@/components/ui/Alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: ReactNode
  requireAuth?: boolean
  requiredRoles?: string[]
  requiredPermission?: string
  fallback?: ReactNode // Optional fallback UI for unauthorized access
}

export const ProtectedRoute = ({
  children,
  requireAuth = true,
  requiredRoles = [],
  requiredPermission,
  fallback
}: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuthStore()
  const { checkPermission, hasRole } = usePermission()
  const location = useLocation()

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If authenticated, proceed to check roles and permissions
  if (isAuthenticated) {
    // Check roles
    if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
      return fallback || (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Alert variant="error" showIcon>
            <div>
              <h3 className="font-semibold">权限不足</h3>
              <p className="text-sm">您没有访问此页面所需的角色权限。</p>
            </div>
          </Alert>
        </div>
      )
    }

    // Check specific permission
    if (requiredPermission && !checkPermission(requiredPermission)) {
      return fallback || (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Alert variant="error" showIcon>
            <div>
              <h3 className="font-semibold">操作受限</h3>
              <p className="text-sm">您的账户无权执行此操作。</p>
            </div>
          </Alert>
        </div>
      )
    }
  }

  // If all checks pass, render the children
  return <>{children}</>
}
