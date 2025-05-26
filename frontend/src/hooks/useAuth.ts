import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'

export const useAuth = () => {
  const store = useAuthStore()
  
  useEffect(() => {
    // Initialize auth on app start
    store.initAuth()
  }, [])
  
  return store
}

// Permission hook
export const usePermission = () => {
  const checkPermission = useAuthStore(state => state.checkPermission)
  const hasRole = useAuthStore(state => state.hasRole)
  
  return {
    checkPermission,
    hasRole,
    canView: (permission: string) => checkPermission(permission),
    // Add other helpers if needed, e.g., canEdit, canDelete
  }
}
