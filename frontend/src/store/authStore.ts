import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiService } from '@/utils/api'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'TEACHER' | 'STUDENT'
  avatar?: string
  createdAt: string
  isActive: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  tokenExpiry: number | null // Unix timestamp in milliseconds
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (data: RegisterData) => Promise<void>
  refreshTokenAction: () => Promise<boolean>
  updateProfile: (data: Partial<User>) => Promise<void>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>
  setUser: (user: User) => void
  setToken: (token: string, refreshToken?: string) => void
  initAuth: () => Promise<void>
  checkPermission: (permission: string) => boolean
  hasRole: (roles: string[]) => boolean
}

interface RegisterData {
  name: string
  email: string
  password: string
  role?: 'STUDENT' | 'TEACHER'
}

// Permission mapping
const PERMISSIONS = {
  // Student permissions
  'learning.view': ['STUDENT', 'TEACHER', 'ADMIN'],
  'exam.take': ['STUDENT'],
  'progress.view': ['STUDENT', 'TEACHER', 'ADMIN'],
  
  // Teacher permissions
  'course.manage': ['TEACHER', 'ADMIN'],
  'question.manage': ['TEACHER', 'ADMIN'],
  'exam.manage': ['TEACHER', 'ADMIN'],
  'user.view_all': ['TEACHER', 'ADMIN'], // Teachers can view all students
  
  // Admin permissions
  'user.manage': ['ADMIN'],
  'settings.manage': ['ADMIN'],
  'file.manage': ['ADMIN', 'TEACHER'], // Teachers can manage their uploaded files
} as const

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      tokenExpiry: null,

      initAuth: async () => {
        set({ isLoading: true })
        const { token, refreshToken, tokenExpiry, user } = get()
        
        // If there's a token and it's not expired (or nearly expired), set authenticated
        if (token && user && tokenExpiry && Date.now() < tokenExpiry - 300000) { // Refresh 5 mins before expiry
          set({ isAuthenticated: true, user, isLoading: false })
        } else if (refreshToken) {
          // Attempt to refresh token
          const success = await get().refreshTokenAction()
          set({ isAuthenticated: success, isLoading: false })
        } else {
          set({ isAuthenticated: false, isLoading: false, user: null, token: null, refreshToken: null, tokenExpiry: null })
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: '' } as any) // Type assertion for error
        try {
          const response = await apiService.login(email, password)
          const { token, refreshToken, user, expiresIn } = response.data
          const tokenExpiry = Date.now() + expiresIn * 1000 // expiresIn is in seconds
          
          set({
            user,
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            tokenExpiry,
          })
          
          // Set up token refresh interval
          const refreshInterval = setInterval(() => {
            if (Date.now() >= (get().tokenExpiry || 0) - 300000) { // 5 minutes before expiry
              get().refreshTokenAction()
            }
          }, 60000) // Check every minute
          
          // Store interval ID to clear on logout
          set({ refreshInterval: refreshInterval } as any) // Store interval ID
        } catch (error: any) {
          set({ isLoading: false, user: null, token: null, refreshToken: null, isAuthenticated: false, tokenExpiry: null })
          throw new Error(error.response?.data?.message || '登录失败')
        }
      },

      logout: () => {
        apiService.logout().finally(() => {
          // Clear refresh interval
          const intervalId = (get() as any).refreshInterval
          if (intervalId) {
            clearInterval(intervalId)
          }
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false, tokenExpiry: null })
          toast.success('您已退出登录！')
        })
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: '' } as any)
        try {
          await apiService.register(data)
          set({ isLoading: false })
        } catch (error: any) {
          set({ isLoading: false })
          throw new Error(error.response?.data?.message || '注册失败')
        }
      },

      refreshTokenAction: async () => {
        const currentRefreshToken = get().refreshToken
        if (!currentRefreshToken) {
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false, tokenExpiry: null })
          return false
        }
        
        try {
          const response = await apiService.refreshToken(currentRefreshToken)
          const { token, refreshToken: newRefreshToken, user, expiresIn } = response.data
          const tokenExpiry = Date.now() + expiresIn * 1000
          
          set({
            user,
            token,
            refreshToken: newRefreshToken,
            isAuthenticated: true,
            tokenExpiry,
          })
          console.log('Token refreshed successfully.')
          return true
        } catch (error) {
          console.error('Failed to refresh token:', error)
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false, tokenExpiry: null })
          return false
        }
      },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true })
        try {
          const response = await apiService.updateProfile(data)
          set(state => ({
            user: state.user ? { ...state.user, ...response.data } : response.data,
            isLoading: false,
          }))
          toast.success('个人资料更新成功！')
        } catch (error: any) {
          set({ isLoading: false })
          throw new Error(error.response?.data?.message || '更新资料失败')
        }
      },

      updatePassword: async (currentPassword: string, newPassword: string) => {
        set({ isLoading: true })
        try {
          await apiService.updatePassword(currentPassword, newPassword)
          set({ isLoading: false })
          toast.success('密码更新成功！')
        } catch (error: any) {
          set({ isLoading: false })
          throw new Error(error.response?.data?.message || '更新密码失败')
        }
      },

      setUser: (user: User) => set({ user, isAuthenticated: true }),
      setToken: (token: string, refreshToken?: string) => {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const tokenExpiry = payload.exp * 1000 // Convert to milliseconds
        set({ token, refreshToken: refreshToken || get().refreshToken, tokenExpiry, isAuthenticated: true })
      },

      checkPermission: (permission: string) => {
        const userRole = get().user?.role
        if (!userRole) return false

        const allowedRoles = (PERMISSIONS as any)[permission]
        return allowedRoles && allowedRoles.includes(userRole)
      },

      hasRole: (roles: string[]) => {
        const userRole = get().user?.role
        if (!userRole) return false
        return roles.includes(userRole)
      },
    }),
    {
      name: 'auth-storage', // name of the item in storage (must be unique)
      getStorage: () => localStorage, // use localStorage for persistence
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        tokenExpiry: state.tokenExpiry,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // If token is present and not expired, try to refresh
          if (state.token && state.tokenExpiry && Date.now() < state.tokenExpiry - 300000) {
            state.isAuthenticated = true
          } else if (state.refreshToken) {
            // Attempt refresh if token is expired but refresh token exists
            state.refreshTokenAction()
          } else {
            state.isAuthenticated = false
            state.user = null
            state.token = null
            state.refreshToken = null
            state.tokenExpiry = null
          }
        }
      },
    }
  )
)
