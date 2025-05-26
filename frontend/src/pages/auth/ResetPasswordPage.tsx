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
