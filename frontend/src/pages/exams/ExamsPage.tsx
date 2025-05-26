import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { examService } from '@/services/examService' 
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ExamCard } from '@/components/exams/ExamCard' 
import { ExamFilters } from '@/components/exams/ExamFilters' 
import { PlusIcon, AcademicCapIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function ExamsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [exams, setExams] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: '',
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    loadExams()
  }, [filters, pagination.page])

  const loadExams = async () => {
    try {
      setIsLoading(true)
      const result = await examService.getExams({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      })
      setExams(result.exams)
      setPagination(result.pagination)
    } catch (err: any) {
      toast.error('加载考试列表失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartExam = async (examId: string) => {
    try {
      const examRecord = await examService.startExam(examId) 
      navigate(`/exams/${examId}/take`) 
    } catch (err: any) {
      toast.error(err.message || '开始考试失败')
    }
  }

  const canCreateExam = user?.role === 'TEACHER' || user?.role === 'ADMIN'

  return (
    <>
      <Helmet>
        <title>考试中心 - AI学习管理系统</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8"> {/* Use container for consistent padding */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4"> {/* Responsive flex */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <AcademicCapIcon className="h-8 w-8 text-primary-600" />
              考试中心
            </h1>
            <p className="mt-2 text-gray-600">
              参加各种考试，检验学习成果
            </p>
          </div>
          {canCreateExam && (
            <Button
              onClick={() => navigate('/exams/create')}
              // icon={PlusIcon} // Assuming Button handles icon internally or via children
            >
              <PlusIcon className="h-5 w-5 mr-2" /> 创建考试
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6">
          <ExamFilters
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Exams Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12"> <LoadingSpinner size="lg"/> </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-12">
            <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无考试</p>
            {canCreateExam && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/exams/create')}
              >
                创建第一个考试
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"> {/* Added xl for more columns */}
              {exams.map(exam => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  onStart={() => handleStartExam(exam.id)}
                  onClick={() => navigate(`/exams/${exam.id}/take`)} 
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  >
                    上一页
                  </Button>
                  <span className="px-3 py-1 text-sm text-gray-600">
                    第 {pagination.page} 页，共 {pagination.totalPages} 页
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                  >
                    下一页
                  </Button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
