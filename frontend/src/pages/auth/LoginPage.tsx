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
