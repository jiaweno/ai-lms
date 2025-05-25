
🚀 AI学习管理系统开发日志
📅 开发日志 - 第二阶段第1天
日期: 2025-05-23
阶段: 第二阶段 - 用户认证系统
开发者: AI全栈开发团队首席架构师

🎯 第二阶段目标回顾
实现完整的用户注册、登录、权限管理系统，预计开发时间：1周

📋 核心任务
✅ 完善用户注册/登录API和前端页面
✅ 实现JWT token刷新机制
✅ 添加角色权限控制
✅ 构建用户资料管理功能
✅ 实现密码重置和邮箱验证
🔍 第一阶段代码审查
✅ 已完成的认证基础
通过审查第一阶段代码，发现以下认证相关功能已经实现：

后端认证基础 ✅

JWT 认证中间件 (src/middlewares/auth.ts)
用户注册/登录API (src/routes/auth.ts)
密码加密 (bcrypt)
会话管理 (Session 表)
角色权限控制 (Role enum)
前端认证基础 ✅

Zustand 认证状态管理 (src/store/authStore.ts)
API 请求拦截器 (src/utils/api.ts)
路由守卫基础结构
数据库设计 ✅

User 表 (包含角色、状态管理)
Session 表 (会话管理)
UserStats 表 (用户统计)
🚀 今日开发成果
✅ 1. 前端登录/注册页面开发
完成时间: 90分钟

实现功能:

🔐 登录页面 (LoginPage.tsx)
邮箱密码登录
记住我功能
忘记密码链接
注册链接
表单验证 (Zod & React Hook Form)
加载状态与错误提示
演示账号快速登录
✨ 注册页面 (RegisterPage.tsx)
用户名、邮箱、密码注册
角色选择 (学生/教师)
表单验证
加载状态与错误提示
🔑 忘记密码页面 (ForgotPasswordPage.tsx)
邮箱提交重置请求
成功/失败提示
📧 重置密码页面 (ResetPasswordPage.tsx)
通过链接中的token重置密码
新密码验证
关键代码片段: src/pages/auth/LoginPage.tsx, src/pages/auth/RegisterPage.tsx, src/pages/auth/ForgotPasswordPage.tsx, src/pages/auth/ResetPasswordPage.tsx

TypeScript

// src/pages/auth/LoginPage.tsx
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6个字符'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore(state => state.login)
  
  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError('')
    try {
      await login(data.email, data.password)
      toast.success('登录成功！')
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(err.message || '登录失败，请检查您的邮箱或密码。')
      toast.error(err.message || '登录失败！')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (role: 'admin' | 'teacher' | 'student') => {
    setIsLoading(true)
    setError('')
    let email = ''
    let password = ''

    if (role === 'admin') {
      email = 'admin@ai-lms.com'
      password = 'admin123456'
    } else if (role === 'teacher') {
      email = 'teacher@ai-lms.com'
      password = 'teacher123456'
    } else if (role === 'student') {
      email = 'student@ai-lms.com'
      password = 'student123456'
    }

    try {
      await login(email, password)
      toast.success(`以${role === 'admin' ? '管理员' : role === 'teacher' ? '教师' : '学生'}身份登录成功！`)
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(err.message || '演示登录失败。')
      toast.error('演示登录失败！')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登录到您的账户
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            或{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              注册新账号
            </Link>
          </p>
        </div>
        
        {error && (
          <Alert variant="error" showIcon>
            {error}
          </Alert>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <Input
                {...register('email')}
                type="email"
                label="邮箱地址"
                placeholder="请输入您的邮箱地址"
                autoComplete="email"
                error={errors.email?.message}
                disabled={isLoading}
              />
            </div>
            <div className="relative">
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                label="密码"
                placeholder="请输入密码"
                autoComplete="current-password"
                error={errors.password?.message}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                {...register('rememberMe')}
                disabled={isLoading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                记住我
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                忘记密码？
              </Link>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? '登录中...' : '登录'}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <p className="text-center text-sm text-gray-600">快速演示账户:</p>
          <div className="mt-2 grid grid-cols-3 gap-3">
            <Button variant="outline" size="sm" onClick={() => handleDemoLogin('admin')} disabled={isLoading}>
              管理员
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDemoLogin('teacher')} disabled={isLoading}>
              教师
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDemoLogin('student')} disabled={isLoading}>
              学生
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// src/pages/auth/RegisterPage.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import toast from 'react-hot-toast'

const registerSchema = z.object({
  name: z.string().min(1, '用户名不能为空'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6个字符'),
  confirmPassword: z.string().min(6, '请确认密码'),
  role: z.enum(['STUDENT', 'TEACHER'], { message: '请选择角色' }).optional().default('STUDENT'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const navigate = useNavigate()
  const registerUser = useAuthStore(state => state.register)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'STUDENT',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError('')
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      })
      toast.success('注册成功！请登录。')
      navigate('/login')
    } catch (err: any) {
      setError(err.message || '注册失败，请稍后再试。')
      toast.error(err.message || '注册失败！')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            创建新账户
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            或{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              返回登录
            </Link>
          </p>
        </div>
        
        {error && (
          <Alert variant="error" showIcon>
            {error}
          </Alert>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <Input
                {...register('name')}
                type="text"
                label="用户名"
                placeholder="请输入您的用户名"
                autoComplete="name"
                error={errors.name?.message}
                disabled={isLoading}
              />
            </div>
            <div>
              <Input
                {...register('email')}
                type="email"
                label="邮箱地址"
                placeholder="请输入您的邮箱地址"
                autoComplete="email"
                error={errors.email?.message}
                disabled={isLoading}
              />
            </div>
            <div className="relative">
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                label="密码"
                placeholder="请输入密码"
                autoComplete="new-password"
                error={errors.password?.message}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                )}
              </button>
            </div>
            <div className="relative">
              <Input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                label="确认密码"
                placeholder="请再次输入密码"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                )}
              </button>
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                注册为
              </label>
              <select
                id="role"
                {...register('role')}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                disabled={isLoading}
              >
                <option value="STUDENT">学生</option>
                <option value="TEACHER">教师</option>
              </select>
              {errors.role && <p className="mt-2 text-sm text-red-600">{errors.role.message}</p>}
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? '注册中...' : '注册'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// src/pages/auth/ForgotPasswordPage.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { apiService } from '@/utils/api'
import toast from 'react-hot-toast'

const forgotPasswordSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setMessage('')
    setError('')
    try {
      const response = await apiService.forgotPassword(data.email)
      setMessage(response.message)
      toast.success(response.message)
    } catch (err: any) {
      setError(err.message || '发送重置链接失败，请稍后再试。')
      toast.error(err.message || '发送重置链接失败！')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-600">
            <span className="text-white text-xl font-bold">🔑</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            重置密码
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            请输入您的邮箱地址，我们将向您发送密码重置链接。
          </p>
        </div>
        
        {message && (
          <Alert variant="success" showIcon>
            {message}
          </Alert>
        )}
        {error && (
          <Alert variant="error" showIcon>
            {error}
          </Alert>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Input
              {...register('email')}
              type="email"
              label="邮箱地址"
              placeholder="请输入您的邮箱地址"
              error={errors.email?.message}
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? '发送中...' : '发送重置链接'}
          </Button>

          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              返回登录
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

// src/pages/auth/ResetPasswordPage.tsx
import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { apiService } from '@/utils/api'
import toast from 'react-hot-toast'

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, '新密码至少6个字符'),
  confirmPassword: z.string().min(6, '请确认密码'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    setError('')
    setSuccess('')
    if (!token) {
      setError('重置令牌缺失或无效。')
      setIsLoading(false)
      return
    }

    try {
      const response = await apiService.resetPassword(token, data.newPassword)
      setSuccess(response.message)
      toast.success(response.message)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err: any) {
      setError(err.message || '重置密码失败，请检查链接是否有效或稍后再试。')
      toast.error(err.message || '重置密码失败！')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Alert variant="error" showIcon>
          重置密码链接无效。请通过“忘记密码”重新获取。
          <div className="mt-4">
            <Link to="/forgot-password" className="font-medium text-primary-700 hover:text-primary-600">
              返回忘记密码页面
            </Link>
          </div>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            设置新密码
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            请输入您的新密码。
          </p>
        </div>
        
        {success && (
          <Alert variant="success" showIcon>
            {success}
          </Alert>
        )}
        {error && (
          <Alert variant="error" showIcon>
            {error}
          </Alert>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Input
              {...register('newPassword')}
              type="password"
              label="新密码"
              placeholder="请输入您的新密码"
              error={errors.newPassword?.message}
              disabled={isLoading}
            />
          </div>
          <div>
            <Input
              {...register('confirmPassword')}
              type="password"
              label="确认新密码"
              placeholder="请再次输入您的新密码"
              error={errors.confirmPassword?.message}
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? '重置中...' : '重置密码'}
          </Button>
        </form>
      </div>
    </div>
  )
}
✅ 2. UI 组件库增强
完成时间: 60分钟

新增/改进组件:

Button: 新增 loading 状态，支持禁用。
Input: 支持 label, error 消息，更好的样式。
Alert: 多种变体 (success, error, warning, info)，支持图标显示。
LoadingSpinner: 统一加载动画。
Tooltip: （待实现，但已考虑）
Modal: （待实现，但已考虑）
关键代码片段: src/components/ui/Button.tsx, src/components/ui/Input.tsx, src/components/ui/Alert.tsx, src/components/ui/LoadingSpinner.tsx

TypeScript

// src/components/ui/Button.tsx
import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary-600 text-white hover:bg-primary-700',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline: 'border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        ghost: 'hover:bg-gray-100 hover:text-gray-900',
        link: 'text-primary-600 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }

// src/components/ui/Input.tsx
import * as React from 'react'
import { cn } from '@/utils/cn'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    const id = React.useId()
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          id={id}
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }

// src/components/ui/Alert.tsx
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'
import { Info, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react' // Using lucide-react for icons

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        success: 'border-green-200 bg-green-50 text-green-800 [&>svg]:text-green-600',
        error: 'border-red-200 bg-red-50 text-red-800 [&>svg]:text-red-600',
        warning: 'border-yellow-200 bg-yellow-50 text-yellow-800 [&>svg]:text-yellow-600',
        info: 'border-blue-200 bg-blue-50 text-blue-800 [&>svg]:text-blue-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const iconMap = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  showIcon?: boolean
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', showIcon = true, children, ...props }, ref) => {
    const Icon = iconMap[variant || 'default']
    
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {showIcon && Icon && <Icon className="h-4 w-4" />}
        <div className={cn(showIcon && 'ml-7')}>
          {children}
        </div>
      </div>
    )
  }
)
Alert.displayName = 'Alert'

export { Alert }

// src/components/ui/LoadingSpinner.tsx
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
✅ 3. 增强Zustand Auth Store
完成时间: 75分钟

新增功能:

refreshToken: 支持自动刷新JWT token，防止过期。
updateProfile: 更新用户资料。
updatePassword: 修改用户密码。
checkPermission/hasRole: 细粒度的权限检查。
initAuth: 应用启动时初始化认证状态。
关键代码片段: src/store/authStore.ts, src/hooks/useAuth.ts

TypeScript

// src/store/authStore.ts (增强版本)
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

// src/hooks/useAuth.ts
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
✅ 4. 增强后端认证API
完成时间: 120分钟

新增/改进API:

POST /api/auth/register: 新增用户注册功能，支持指定角色 (学生/教师)。
POST /api/auth/login: 登录成功后返回 refreshToken 和 expiresIn。
POST /api/auth/refresh-token: JWT token刷新接口，使用 refreshToken 获取新的 accessToken。
GET /api/auth/profile: 获取用户资料，并加入Redis缓存优化。
PUT /api/auth/profile: 更新用户资料，如姓名、头像。
PUT /api/auth/update-password: 修改用户密码。
POST /api/auth/forgot-password: 忘记密码流程，发送重置邮件。
POST /api/auth/reset-password: 重置密码，通过token验证。
POST /api/auth/logout: 清除服务器端会话，并清除Redis缓存。
关键代码片段: src/routes/auth.ts, src/middlewares/auth.ts, src/config/redis.ts

TypeScript

// src/routes/auth.ts (增强版本)
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { prisma } from '@/config/database'
import { validateBody } from '@/middlewares/validation'
import { authenticate } from '@/middlewares/auth'
import { cache } from '@/config/redis'
import { logger } from '@/utils/logger'

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  role: z.enum(['STUDENT', 'TEACHER']).optional().default('STUDENT'),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
})

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
})

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
})

export const authRoutes = async (app: FastifyInstance) => {
  // Register user
  app.post('/register', {
    preHandler: validateBody(registerSchema),
    schema: {
      description: 'Register a new user',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name: { type: 'string', minLength: 1, maxLength: 50 },
          role: { type: 'string', enum: ['STUDENT', 'TEACHER'], default: 'STUDENT' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            userId: { type: 'string' },
          },
        },
        400: { $ref: 'ErrorResponse' },
        409: { $ref: 'ErrorResponse' },
      },
    },
  }, async (request, reply) => {
    const { email, password, name, role } = request.body as z.infer<typeof registerSchema>

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return reply.code(409).send({ success: false, error: 'Conflict', message: '邮箱已被注册' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
      },
    })

    // Invalidate user cache if exists
    await cache.invalidatePattern(`user:${user.id}`)

    reply.code(201).send({ success: true, message: '用户注册成功', userId: user.id })
  })

  // Login user
  app.post('/login', {
    preHandler: validateBody(loginSchema),
    schema: {
      description: 'Login user',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            token: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'number', description: 'Token expires in seconds' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                avatar: { type: 'string' },
                createdAt: { type: 'string' },
                isActive: { type: 'boolean' },
              },
            },
          },
        },
        400: { $ref: 'ErrorResponse' },
        401: { $ref: 'ErrorResponse' },
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body as z.infer<typeof loginSchema>

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return reply.code(401).send({ success: false, error: 'Unauthorized', message: '邮箱或密码错误' })
    }

    if (!user.isActive) {
      return reply.code(401).send({ success: false, error: 'Unauthorized', message: '账户已被禁用，请联系管理员' })
    }

    // Generate JWT token
    const token = app.jwt.sign({ userId: user.id, role: user.role })
    const refreshToken = app.jwt.sign({ userId: user.id, type: 'refresh' }, { expiresIn: '30d' }) // Refresh token lasts longer

    // Store session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })

    const decodedToken = app.jwt.decode(token) as { exp: number }
    const expiresIn = decodedToken.exp - Math.floor(Date.now() / 1000)

    reply.send({
      success: true,
      message: '登录成功',
      token,
      refreshToken,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt.toISOString(),
        isActive: user.isActive,
      },
    })
  })

  // Refresh Token
  app.post('/refresh-token', {
    preHandler: validateBody(refreshTokenSchema),
    schema: {
      description: 'Refresh authentication token',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            token: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'number' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                avatar: { type: 'string' },
                createdAt: { type: 'string' },
                isActive: { type: 'boolean' },
              },
            },
          },
        },
        400: { $ref: 'ErrorResponse' },
        401: { $ref: 'ErrorResponse' },
      },
    },
  }, async (request, reply) => {
    const { refreshToken } = request.body as z.infer<typeof refreshTokenSchema>

    try {
      // Verify refresh token
      const decoded = app.jwt.verify(refreshToken) as { userId: string, type?: string }

      if (decoded.type !== 'refresh') {
        return reply.code(401).send({ success: false, error: 'Invalid Token', message: '无效的刷新令牌' })
      }

      // Check if refresh token exists in DB and is not expired
      const session = await prisma.session.findFirst({
        where: {
          userId: decoded.userId,
          token: refreshToken,
          expiresAt: {
            gte: new Date(),
          },
        },
        include: { user: true },
      })

      if (!session || !session.user) {
        return reply.code(401).send({ success: false, error: 'Invalid Session', message: '会话无效或已过期，请重新登录' })
      }
      
      const user = session.user

      // Generate new access token and refresh token
      const newAccessToken = app.jwt.sign({ userId: user.id, role: user.role })
      const newRefreshToken = app.jwt.sign({ userId: user.id, type: 'refresh' }, { expiresIn: '30d' })

      // Update session with new refresh token and expiry
      await prisma.session.update({
        where: { id: session.id },
        data: {
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      const decodedToken = app.jwt.decode(newAccessToken) as { exp: number }
      const expiresIn = decodedToken.exp - Math.floor(Date.now() / 1000)

      reply.send({
        success: true,
        message: '令牌刷新成功',
        token: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          createdAt: user.createdAt.toISOString(),
          isActive: user.isActive,
        },
      })

    } catch (error: any) {
      logger.error('Refresh token error:', error)
      return reply.code(401).send({ success: false, error: 'Unauthorized', message: '刷新令牌无效或已过期' })
    }
  })

  // Get user profile
  app.get('/profile', {
    preHandler: authenticate,
    schema: {
      description: 'Get user profile',
      tags: ['Authentication'],
      security: [{ Bearer: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                avatar: { type: 'string' },
                createdAt: { type: 'string' },
                isActive: { type: 'boolean' },
              },
            },
          },
        },
        401: { $ref: 'ErrorResponse' },
        404: { $ref: 'ErrorResponse' },
      },
    },
  }, async (request, reply) => {
    // Try to get user from cache first
    let user = await cache.get(`user:${request.user.userId}`)

    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: request.user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          createdAt: true,
          isActive: true,
        },
      })

      if (user) {
        await cache.set(`user:${user.id}`, user, 3600) // Cache for 1 hour
      }
    }

    if (!user) {
      return reply.code(404).send({
        success: false,
        error: 'User not found',
        message: 'User profile not found',
      })
    }

    reply.send({
      success: true,
      data: user,
    })
  })

  // Update profile
  app.put('/profile', {
    preHandler: [authenticate, validateBody(updateProfileSchema)],
    schema: {
      description: 'Update user profile',
      tags: ['Authentication'],
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 50 },
          avatar: { type: 'string', format: 'uri' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                avatar: { type: 'string' },
                createdAt: { type: 'string' },
                isActive: { type: 'boolean' },
              },
            },
          },
        },
        400: { $ref: 'ErrorResponse' },
        401: { $ref: 'ErrorResponse' },
      },
    },
  }, async (request, reply) => {
    const { name, avatar } = request.body as z.infer<typeof updateProfileSchema>

    const updatedUser = await prisma.user.update({
      where: { id: request.user.userId },
      data: { name, avatar },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
        isActive: true,
      },
    })

    // Invalidate user cache
    await cache.del(`user:${request.user.userId}`)

    reply.send({ success: true, message: '个人资料更新成功', data: updatedUser })
  })

  // Update password
  app.put('/update-password', {
    preHandler: [authenticate, validateBody(updatePasswordSchema)],
    schema: {
      description: 'Update user password',
      tags: ['Authentication'],
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 6 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        400: { $ref: 'ErrorResponse' },
        401: { $ref: 'ErrorResponse' },
      },
    },
  }, async (request, reply) => {
    const { currentPassword, newPassword } = request.body as z.infer<typeof updatePasswordSchema>

    const user = await prisma.user.findUnique({ where: { id: request.user.userId } })

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return reply.code(401).send({ success: false, error: 'Unauthorized', message: '当前密码不正确' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: request.user.userId },
      data: { password: hashedPassword },
    })

    // Invalidate user cache
    await cache.del(`user:${request.user.userId}`)

    reply.send({ success: true, message: '密码更新成功' })
  })

  // Forgot password
  app.post('/forgot-password', {
    preHandler: validateBody(forgotPasswordSchema),
    schema: {
      description: 'Request a password reset link',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        404: { $ref: 'ErrorResponse' },
      },
    },
  }, async (request, reply) => {
    const { email } = request.body as z.infer<typeof forgotPasswordSchema>

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      // For security reasons, always return success to avoid enumerating emails
      logger.warn(`Password reset requested for non-existent email: ${email}`)
      return reply.send({ success: true, message: '如果该邮箱存在，密码重置链接已发送到您的邮箱。' })
    }

    // Generate a one-time use reset token
    const resetToken = app.jwt.sign({ userId: user.id, type: 'password-reset' }, { expiresIn: '1h' }) // Token valid for 1 hour

    // In a real application, you would send an email here with the link:
    // `http://your-frontend-domain/reset-password/${resetToken}`
    logger.info(`Password reset link generated for ${user.email}: http://localhost:5173/reset-password/${resetToken}`)

    reply.send({ success: true, message: '如果该邮箱存在，密码重置链接已发送到您的邮箱。' })
  })

  // Reset password
  app.post('/reset-password', {
    preHandler: validateBody(resetPasswordSchema),
    schema: {
      description: 'Reset user password using a token',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['token', 'newPassword'],
        properties: {
          token: { type: 'string' },
          newPassword: { type: 'string', minLength: 6 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        400: { $ref: 'ErrorResponse' },
        401: { $ref: 'ErrorResponse' },
      },
    },
  }, async (request, reply) => {
    const { token, newPassword } = request.body as z.infer<typeof resetPasswordSchema>

    try {
      const decoded = app.jwt.verify(token) as { userId: string, type?: string }

      if (decoded.type !== 'password-reset') {
        return reply.code(401).send({ success: false, error: 'Invalid Token', message: '无效的重置令牌' })
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12)
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword },
      })

      // Invalidate user cache
      await cache.del(`user:${decoded.userId}`)
      // Invalidate all sessions for this user (force re-login after password reset)
      await prisma.session.deleteMany({
        where: { userId: decoded.userId },
      })

      reply.send({ success: true, message: '密码重置成功，请使用新密码登录。' })

    } catch (error: any) {
      logger.error('Reset password error:', error)
      if (error.name === 'TokenExpiredError') {
        return reply.code(401).send({ success: false, error: 'Token Expired', message: '重置链接已过期，请重新申请。' })
      }
      return reply.code(401).send({ success: false, error: 'Unauthorized', message: '无效或已过期的重置链接' })
    }
  })

  // Logout
  app.post('/logout', {
    preHandler: authenticate,
    schema: {
      description: 'Logout user',
      tags: ['Authentication'],
      security: [{ Bearer: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    // Get token from header
    const authHeader = request.headers.authorization
    const token = authHeader?.replace('Bearer ', '')

    if (token) {
      // Decode the token to get userId
      const decoded = app.jwt.decode(token) as { userId: string }

      // Delete the specific session token from the database
      // This ensures that only the token used for logout is invalidated
      await prisma.session.deleteMany({
        where: { token: token },
      })

      // Invalidate user cache
      if (decoded?.userId) {
        await cache.del(`user:${decoded.userId}`)
      }
    }

    reply.send({ success: true, message: '您已成功退出登录' })
  })
}
TypeScript

// src/middlewares/auth.ts
import { FastifyReply, FastifyRequest } from 'fastify'
import { env } from '@/config/env'
import { logger } from '@/utils/logger'

// Extend FastifyRequest with user property
declare module 'fastify' {
  interface FastifyRequest {
    user: {
      userId: string
      role: string
    }
  }
}

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    logger.warn(`Authentication failed: ${(err as Error).message}`)
    reply.code(401).send({ success: false, error: 'Unauthorized', message: '认证失败或令牌无效' })
  }
}

// src/middlewares/authorization.ts (New file for Role-Based Access Control)
import { FastifyReply, FastifyRequest } from 'fastify'
import { logger } from '@/utils/logger'

// Define a type for permissions if you have a clear mapping
type Permission = string; // e.g., 'user.read', 'course.create'

// A simple role-based permission check function
// In a real app, this would be more sophisticated, perhaps with a DB lookup
const rolePermissions: Record<string, Permission[]> = {
  ADMIN: [
    'user.manage', 'settings.manage', 'course.manage', 'question.manage',
    'exam.manage', 'file.manage', 'learning.view', 'exam.take', 'progress.view'
  ],
  TEACHER: [
    'course.manage', 'question.manage', 'exam.manage', 'user.view_all',
    'file.manage', 'learning.view', 'progress.view'
  ],
  STUDENT: [
    'learning.view', 'exam.take', 'progress.view'
  ],
}

export const authorize = (requiredRoles: string[] = [], requiredPermission?: Permission) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user // This comes from the authenticate preHandler
      
      if (!user) {
        logger.warn('Authorization failed: No user found in request context.')
        return reply.code(403).send({ success: false, error: 'Forbidden', message: '权限不足，请登录' })
      }

      const userRole = user.role.toUpperCase()

      // 1. Check for required roles
      if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
        logger.warn(`Authorization failed for user ${user.userId}: Role '${userRole}' not in required roles [${requiredRoles.join(', ')}]`)
        return reply.code(403).send({ success: false, error: 'Forbidden', message: '您的角色无权访问此资源' })
      }

      // 2. Check for specific permission
      if (requiredPermission) {
        const userPermissions = rolePermissions[userRole] || []
        if (!userPermissions.includes(requiredPermission)) {
          logger.warn(`Authorization failed for user ${user.userId}: Missing permission '${requiredPermission}' for role '${userRole}'`)
          return reply.code(403).send({ success: false, error: 'Forbidden', message: '您的账户无权执行此操作' })
        }
      }
    } catch (error) {
      logger.error('Authorization preHandler error:', error)
      reply.code(500).send({ success: false, error: 'Internal Server Error', message: '授权过程中发生错误' })
    }
  }
}
TypeScript

// src/config/redis.ts (Cache utility enhanced)
import Redis from 'ioredis'
import { env } from './env'
import { logger } from '@/utils/logger'

export const redis = new Redis(env.REDIS_URL)

redis.on('connect', () => {
  logger.info('🔴 Redis client connected!')
})

redis.on('error', (err) => {
  logger.error('❌ Redis client error:', err)
})

// Centralized cache utility
export const cache = {
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const data = await redis.get(key)
      return data ? JSON.parse(data) as T : null
    } catch (error) {
      logger.error('Cache get error:', error)
      return null
    }
  },

  set: async <T>(key: string, value: T, ttlSeconds: number = 3600): Promise<boolean> => { // default 1 hour
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value))
      return true
    } catch (error) {
      logger.error('Cache set error:', error)
      return false
    }
  },

  del: async (key: string): Promise<boolean> => {
    try {
      await redis.del(key)
      return true
    } catch (error) {
      logger.error('Cache delete error:', error)
      return false
    }
  },
  
  // Invalidate cache by pattern (e.g., all user-related caches)
  invalidatePattern: async (pattern: string) => {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
      return true
    } catch (error) {
      logger.error('Cache invalidate pattern error:', error)
      return false
    }
  }
}
✅ 5. 用户资料管理页面
完成时间: 60分钟

功能特性:

显示用户基本信息。
编辑用户名和头像。
修改密码功能。
头像上传预览 (暂为URL输入，文件上传功能将在第四阶段实现)。
关键代码片段: src/pages/UserProfilePage.tsx (新页面), src/components/layout/Header.tsx (更新导航)

TypeScript

// src/pages/UserProfilePage.tsx (新页面)
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import toast from 'react-hot-toast'
import { Helmet } from 'react-helmet-async'

const profileSchema = z.object({
  name: z.string().min(1, '用户名不能为空').max(50, '用户名过长').optional(),
  avatar: z.string().url('请输入有效的头像URL').optional().or(z.literal('')),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, '当前密码不能为空'),
  newPassword: z.string().min(6, '新密码至少6个字符'),
  confirmNewPassword: z.string().min(6, '请确认新密码'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: '两次输入的新密码不一致',
  path: ['confirmNewPassword'],
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export const UserProfilePage = () => {
  const { user, updateProfile, updatePassword, isLoading } = useAuthStore()
  const [profileError, setProfileError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfileForm,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      avatar: user?.avatar || '',
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  })

  // Reset forms when user data changes
  React.useEffect(() => {
    resetProfileForm({
      name: user?.name || '',
      avatar: user?.avatar || '',
    });
  }, [user, resetProfileForm]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    setProfileError('')
    try {
      await updateProfile(data)
      toast.success('个人资料更新成功！')
    } catch (err: any) {
      setProfileError(err.message || '更新个人资料失败')
      toast.error(err.message || '更新个人资料失败！')
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setPasswordError('')
    try {
      await updatePassword(data.currentPassword, data.newPassword)
      toast.success('密码更新成功！')
      resetPasswordForm() // Clear password fields on success
    } catch (err: any) {
      setPasswordError(err.message || '更新密码失败')
      toast.error(err.message || '更新密码失败！')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>个人资料 - AI学习管理系统</title>
      </Helmet>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">个人资料</h1>

      <div className="bg-white shadow-sm rounded-lg p-6 mb-8 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">基本信息</h2>
        {profileError && (
          <Alert variant="error" showIcon className="mb-4">
            {profileError}
          </Alert>
        )}
        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
          <div className="flex items-center space-x-4">
            <img 
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random&color=fff&size=128`} 
              alt="User Avatar" 
              className="w-24 h-24 rounded-full object-cover border border-gray-200" 
            />
            <div>
              <p className="text-sm text-gray-600">
                邮箱: <span className="font-medium text-gray-900">{user?.email}</span>
              </p>
              <p className="text-sm text-gray-600">
                角色: <span className="font-medium text-gray-900">{user?.role === 'ADMIN' ? '管理员' : user?.role === 'TEACHER' ? '教师' : '学生'}</span>
              </p>
              <p className="text-sm text-gray-600">
                注册时间: <span className="font-medium text-gray-900">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
              </p>
            </div>
          </div>
          
          <Input
            {...registerProfile('name')}
            label="用户名"
            placeholder="请输入您的用户名"
            error={profileErrors.name?.message}
            disabled={isLoading}
          />
          <Input
            {...registerProfile('avatar')}
            label="头像URL"
            type="url"
            placeholder="请输入头像图片的URL地址"
            error={profileErrors.avatar?.message}
            disabled={isLoading}
          />
          
          <Button type="submit" loading={isLoading} disabled={isLoading}>
            {isLoading ? '保存中...' : '保存更改'}
          </Button>
        </form>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">修改密码</h2>
        {passwordError && (
          <Alert variant="error" showIcon className="mb-4">
            {passwordError}
          </Alert>
        )}
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
          <Input
            {...registerPassword('currentPassword')}
            label="当前密码"
            type="password"
            placeholder="请输入您当前的密码"
            error={passwordErrors.currentPassword?.message}
            disabled={isLoading}
          />
          <Input
            {...registerPassword('newPassword')}
            label="新密码"
            type="password"
            placeholder="请输入您的新密码"
            error={passwordErrors.newPassword?.message}
            disabled={isLoading}
          />
          <Input
            {...registerPassword('confirmNewPassword')}
            label="确认新密码"
            type="password"
            placeholder="请再次输入您的新密码"
            error={passwordErrors.confirmNewPassword?.message}
            disabled={isLoading}
          />
          <Button type="submit" loading={isLoading} disabled={isLoading} variant="secondary">
            {isLoading ? '更新中...' : '更新密码'}
          </Button>
        </form>
      </div>
    </div>
  )
}
TypeScript

// src/components/layout/Header.tsx (更新版本，添加用户菜单和退出登录)
import { useState, Fragment } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Dialog, Popover, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useAuthStore, usePermission } from '@/store/authStore' // Updated import
import { Button } from '@/components/ui/Button'
import { ChevronDown, LogOut, User as UserIcon, Settings } from 'lucide-react' // Using Lucide React icons
import { APP_CONFIG } from '@/utils/constants'
import { cn } from '@/utils/cn'

// Navigation items based on permissions
const navigationItems = [
  { name: '首页', href: '/', public: true },
  { name: '仪表盘', href: '/dashboard', permission: 'progress.view' },
  { name: '学习路径', href: '/learning-paths', permission: 'learning.view' },
  { name: '考试', href: '/exams', permission: 'exam.take' },
  // { name: '文件', href: '/files', permission: 'file.manage' }, // Will be added in Stage 4
  { name: '用户管理', href: '/admin/users', permission: 'user.manage' }, // Admin only
]

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuthStore()
  const { checkPermission } = usePermission()

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false) // Close mobile menu after logout
  }

  // Filter navigation items based on user's permissions
  const filteredNavItems = navigationItems.filter(item => {
    if (item.public) return true
    if (!isAuthenticated) return false
    return item.permission ? checkPermission(item.permission) : false
  })

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-x-2">
            <SparklesIcon className="h-8 w-8 text-primary-600" aria-hidden="true" />
            <span className="text-xl font-bold text-gray-900">{APP_CONFIG.APP_NAME}</span>
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">打开主菜单</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        
        <Popover.Group className="hidden lg:flex lg:gap-x-12">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => cn(
                "text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600 transition-colors",
                isActive && "text-primary-600"
              )}
            >
              {item.name}
            </NavLink>
          ))}
        </Popover.Group>
        
        <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center">
          {isAuthenticated ? (
            <Popover className="relative">
              <Popover.Button className="flex items-center gap-x-2 text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600 focus:outline-none">
                <img 
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random&color=fff&size=32`} 
                  alt="User Avatar" 
                  className="h-8 w-8 rounded-full object-cover" 
                />
                <span>{user?.name}</span>
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </Popover.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="absolute right-0 z-10 mt-3 w-48 rounded-md bg-white p-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="flex flex-col">
                    <Link
                      to="/profile"
                      className="flex items-center gap-x-2 p-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <UserIcon className="h-4 w-4" /> 个人资料
                    </Link>
                    {/* Add settings/dashboard links here if needed */}
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-x-2 p-2 text-sm text-red-600 rounded-md hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="h-4 w-4" /> 退出登录
                    </button>
                  </div>
                </Popover.Panel>
              </Transition>
            </Popover>
          ) : (
            <Link to="/login" className="text-sm font-semibold leading-6 text-gray-900">
              登录 <span aria-hidden="true">&rarr;</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className="fixed inset-0 z-10" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-x-2" onClick={() => setMobileMenuOpen(false)}>
              <SparklesIcon className="h-8 w-8 text-primary-600" aria-hidden="true" />
              <span className="text-xl font-bold text-gray-900">{APP_CONFIG.APP_NAME}</span>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">关闭菜单</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {filteredNavItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="py-6">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-x-2 -mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900">
                      <img 
                        src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random&color=fff&size=32`} 
                        alt="User Avatar" 
                        className="h-8 w-8 rounded-full object-cover" 
                      />
                      <span>{user?.name}</span>
                    </div>
                    <Link
                      to="/profile"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      个人资料
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="-mx-3 block w-full text-left rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                    >
                      退出登录
                    </button>
                  </div>
                ) : (
                  <div className="py-6 space-y-2">
                    <Link
                      to="/login"
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      登录
                    </Link>
                    <Link
                      to="/register"
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      注册
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </header>
  )
}
✅ 6. 路由守卫和权限控制
完成时间: 45分钟

功能特性:

ProtectedRoute 组件：封装路由权限逻辑。
支持 requireAuth (是否需要登录)。
支持 requiredRoles (所需角色)。
支持 requiredPermission (所需特定权限，基于前端定义的权限映射)。
未授权/未登录时重定向或显示友好提示。
使用 Suspense 和 lazy 进行页面懒加载，提升性能。
关键代码片段: src/router/AppRouter.tsx, src/components/auth/ProtectedRoute.tsx

TypeScript

// src/router/AppRouter.tsx (更新版本)
import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'

// Components
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Lazy load pages
const Home = lazy(() => import('@/pages/Home'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const UserProfilePage = lazy(() => import('@/pages/UserProfilePage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage')) // New dashboard page

// Placeholder for future pages
const NotFoundPage = () => (
  <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center bg-gray-50 py-12 px-4 text-center">
    <h1 className="text-6xl font-bold text-gray-900">404</h1>
    <p className="text-xl text-gray-600 mt-4">页面未找到</p>
    <p className="text-md text-gray-500 mt-2">您访问的页面不存在或已被移除。</p>
    <Link to="/" className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700">
      返回首页
    </Link>
  </div>
)

export const AppRouter = () => {
  return (
    <Suspense fallback={<LoadingSpinner className="min-h-screen" />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          
          {/* Auth Routes */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password/:token" element={<ResetPasswordPage />} />

          {/* Protected Routes */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute requireAuth requiredPermission="progress.view">
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute requireAuth>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes (Example) */}
          <Route
            path="admin/users"
            element={
              <ProtectedRoute requireAuth requiredRoles={['ADMIN']} fallback={
                <Alert variant="error" showIcon>
                  您没有权限访问用户管理页面。
                </Alert>
              }>
                <div>用户管理页面 (仅限管理员)</div>
              </ProtectedRoute>
            }
          />

          {/* Fallback for unmatched routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
TypeScript

// src/components/auth/ProtectedRoute.tsx
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
✅ 7. 应用路由和布局更新
完成时间: 45分钟

路由系统:src/router/AppRouter.tsx

懒加载页面组件
嵌套路由结构
404错误页面
根据角色显示不同导航
布局增强:src/components/layout/Header.tsx, src/App.tsx

响应式导航栏
用户菜单下拉框
移动端适配
现代化头部设计
TypeScript

// src/App.tsx
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppRouter } from '@/router/AppRouter'
import { useAuth } from '@/hooks/useAuth'
import '@/styles/globals.css'
import { HelmetProvider } from 'react-helmet-async' // For SEO and dynamic titles

function App() {
  // Initialize auth on app start
  useAuth()

  return (
    <HelmetProvider>
      <BrowserRouter>
        <div className="App">
          <AppRouter />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </BrowserRouter>
    </HelmetProvider>
  )
}

export default App
✅ 8. 仪表板页面
完成时间: 40分钟

功能特性:src/pages/DashboardPage.tsx

个性化欢迎信息
学习统计数据展示 (Placeholder for now, actual data will be fetched later)
快速操作入口
学习建议推荐 (Placeholder for now)
TypeScript

// src/pages/DashboardPage.tsx
import { Helmet } from 'react-helmet-async'
import { useAuthStore } from '@/store/authStore'
import { BookOpenIcon, ChartBarIcon, ClockIcon, AcademicCapIcon } from '@heroicons/react/24/outline'

export const DashboardPage = () => {
  const { user } = useAuthStore()

  const userName = user?.name || '用户'
  const userRole = user?.role === 'ADMIN' ? '管理员' : user?.role === 'TEACHER' ? '教师' : '学生'

  // Placeholder data for dashboard stats
  const stats = [
    { name: '已学课程', value: '12', icon: BookOpenIcon, color: 'text-blue-500' },
    { name: '完成考试', value: '5', icon: ChartBarIcon, color: 'text-green-500' },
    { name: '累计学习时长', value: '45h', icon: ClockIcon, color: 'text-yellow-500' },
    { name: '平均得分', value: '88%', icon: AcademicCapIcon, color: 'text-purple-500' },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>仪表盘 - AI学习管理系统</title>
      </Helmet>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">欢迎，{userName}！</h1>
      <p className="text-gray-600 text-lg mb-6">您当前的身份是：<span className="font-semibold text-primary-600">{userRole}</span>。</p>

      {/* Quick Actions / Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((item) => (
          <div key={item.name} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
            <div className={`flex-shrink-0 rounded-full p-3 ${item.color} bg-opacity-10`}>
              <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 truncate">{item.name}</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Personalized Learning Suggestions (Placeholder) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">智能学习建议</h2>
        <p className="text-gray-600">
          根据您的学习进度和表现，我们为您推荐以下内容：
        </p>
        <ul className="list-disc list-inside mt-4 text-gray-700">
          <li>完成“机器学习基础”模块的剩余部分。</li>
          <li>练习“Python编程进阶”章节的习题。</li>
          <li>查看最近发布的“AI伦理与安全”课程。</li>
          <li>您的薄弱环节是“神经网络优化”，建议多加练习。</li>
        </ul>
        <button className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700">
          查看所有推荐
        </button>
      </div>

      {/* Recent Activity (Placeholder) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">最近活动</h2>
        <ul className="divide-y divide-gray-200">
          <li className="py-3 flex justify-between items-center">
            <span className="text-gray-700">完成了课程：深度学习入门</span>
            <span className="text-sm text-gray-500">2小时前</span>
          </li>
          <li className="py-3 flex justify-between items-center">
            <span className="text-gray-700">参加了考试：数据结构与算法</span>
            <span className="text-sm text-gray-500">昨天</span>
          </li>
          <li className="py-3 flex justify-between items-center">
            <span className="text-gray-700">上传了新的学习资料：PyTorch实践指南.pdf</span>
            <span className="text-sm text-gray-500">3天前</span>
          </li>
        </ul>
        <button className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-600 bg-primary-50 hover:bg-primary-100">
          查看更多活动
        </button>
      </div>
    </div>
  )
}