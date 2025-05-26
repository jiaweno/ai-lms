import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { learningPathService } from '@/services/learningPathService'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { LearningPathCard } from '@/components/learningPaths/LearningPathCard'
import { PlusIcon, AcademicCapIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function LearningPathsPage() {
  const navigate = useNavigate()
  const [paths, setPaths] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'enrolled' | 'created'>('all')

  useEffect(() => {
    loadPaths()
  }, [])

  const loadPaths = async () => {
    try {
      const data = await learningPathService.getPaths()
      setPaths(data)
    } catch (err: any) {
      toast.error('加载学习路径失败')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPaths = paths.filter(path => {
    if (filter === 'enrolled') return path.progress?.enrolled
    if (filter === 'created') return path.createdBy.id === 'currentUserId' // Replace with actual user ID
    return true
  })

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />
  }

  return (
    <>
      <Helmet>
        <title>学习路径 - AI学习管理系统</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <AcademicCapIcon className="h-8 w-8 text-primary-600" />
              学习路径
            </h1>
            <p className="mt-2 text-gray-600">
              探索AI生成的个性化学习路径，系统化提升你的知识技能
            </p>
          </div>
          <Button
            onClick={() => navigate('/files')} // Navigate to a page where user can start analysis or upload
            icon={PlusIcon}
          >
            创建新路径
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            全部路径
          </Button>
          <Button
            variant={filter === 'enrolled' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('enrolled')}
          >
            已加入
          </Button>
          <Button
            variant={filter === 'created' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('created')}
          >
            我创建的
          </Button>
        </div>

        {/* Paths Grid */}
        {filteredPaths.length === 0 ? (
          <div className="text-center py-12">
            <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无学习路径</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/files')}
            >
              上传文档创建路径
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPaths.map(path => (
              <LearningPathCard
                key={path.id}
                path={path}
                onClick={() => navigate(`/learning-paths/${path.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
