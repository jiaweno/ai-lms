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
