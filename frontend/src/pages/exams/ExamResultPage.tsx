import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom' 
import { Helmet } from 'react-helmet-async'
import { examService } from '@/services/examService'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { QuestionRenderer } from '@/components/exams/QuestionRenderer'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  ArrowLeftIcon 
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale' 
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast' 

export default function ExamResultPage() {
  const { examId } = useParams<{ examId: string }>() 
  const navigate = useNavigate()
  
  const [result, setResult] = useState<any>(null) 
  const [isLoading, setIsLoading] = useState(true)
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null)

  useEffect(() => {
    if (examId) {
      loadResult()
    }
  }, [examId])

  const loadResult = async () => {
    if (!examId) return;
    try {
      setIsLoading(true)
      // The examId for getExamResult might be the ExamRecord ID.
      // Assuming the route or service handles fetching the correct record.
      // If recordId is needed and not available directly from URL, it might need to be passed via state from ExamTakePage.
      const data = await examService.getExamResult(examId) // This might need to be recordId
      setResult(data)
    } catch (err: any) {
      console.error('Load result error:', err)
      toast.error(err.message || '无法加载考试结果');
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />
  }

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert variant="error" showIcon>
          无法加载考试结果。可能是因为您尚未完成该考试，或者结果不存在。
        </Alert>
        <Button onClick={() => navigate('/exams')} className="mt-4">
          返回考试列表
        </Button>
      </div>
    )
  }

  const { exam = {}, answers = [], score = 0, statistics = {}, timeSpent = 0, submittedAt } = result;
  const { 
    correctAnswers = 0, 
    totalQuestions = answers.length, 
    accuracy = 0, 
    passed = false 
  } = statistics;


  return (
    <>
      <Helmet>
        <title>考试结果 - {exam.title || '未知考试'}</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/exams')}
              className="mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              返回考试列表
            </Button>
            
            <h1 className="text-3xl font-bold text-gray-900">{exam.title || '考试结果'}</h1>
            <p className="mt-2 text-gray-600">考试结果详情</p>
          </div>

          {/* Result Summary */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Score */}
              <div className="text-center">
                <div className={cn(
                  'text-4xl font-bold mb-2',
                  passed ? 'text-green-600' : 'text-red-600'
                )}>
                  {score ?? 0}
                </div>
                <div className="text-gray-600">
                  总分 {exam.totalPoints || 0}
                </div>
                {passed !== null && (
                  <div className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium mt-2',
                    passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  )}>
                    {passed ? (
                      <CheckCircleIcon className="h-4 w-4" />
                    ) : (
                      <XCircleIcon className="h-4 w-4" />
                    )}
                    {passed ? '通过' : '未通过'}
                  </div>
                )}
              </div>

              {/* Accuracy */}
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {accuracy?.toFixed(2) ?? 0}%
                </div>
                <div className="text-gray-600">正确率</div>
                <div className="text-sm text-gray-500 mt-2">
                  {correctAnswers} / {totalQuestions} 题
                </div>
              </div>

              {/* Time */}
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {Math.floor((timeSpent || 0) / 60)}
                </div>
                <div className="text-gray-600">用时（分钟）</div>
                <div className="text-sm text-gray-500 mt-2">
                  {timeSpent ? `${timeSpent % 60} 秒` : '0 秒'}
                </div>
              </div>

              {/* Submission Time */}
              <div className="text-center">
                <div className="text-lg font-medium text-gray-700 mb-2">
                  {submittedAt ? formatDistanceToNow(new Date(submittedAt), {
                    addSuffix: true,
                    locale: zhCN,
                  }) : 'N/A'}
                </div>
                <div className="text-gray-600">提交时间</div>
                <div className="text-sm text-gray-500 mt-2">
                  {submittedAt ? new Date(submittedAt).toLocaleString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Question Review */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">答题详情</h2>
            
            {answers && answers.length > 0 ? (
              <>
                <div className="mb-6">
                  <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-2">
                    {answers.map((answerItem: any, index: number) => ( // Changed 'answer' to 'answerItem' to avoid conflict
                      <button
                        key={answerItem.id || index} 
                        onClick={() => setSelectedQuestionIndex(index)}
                        className={cn(
                          'w-10 h-10 rounded-lg border-2 flex items-center justify-center text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2',
                          selectedQuestionIndex === index ? 'ring-primary-500 border-primary-500' : 'border-gray-300',
                          answerItem.isCorrect === true && 'bg-green-100 text-green-700 border-green-500',
                          answerItem.isCorrect === false && 'bg-red-100 text-red-700 border-red-500',
                          answerItem.isCorrect === null && 'bg-gray-100 text-gray-600' 
                        )}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border-2 border-green-500 bg-green-100"></div>
                      <span>正确</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border-2 border-red-500 bg-red-100"></div>
                      <span>错误</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border-2 border-gray-300 bg-gray-100"></div>
                      <span>未评分/简答</span>
                    </div>
                  </div>
                </div>

                {selectedQuestionIndex !== null && answers[selectedQuestionIndex] && answers[selectedQuestionIndex].question && (
                  <div className="border-t pt-6">
                    <QuestionRenderer
                      question={answers[selectedQuestionIndex].question}
                      answer={answers[selectedQuestionIndex].content}
                      onAnswerChange={() => {}} 
                      questionNumber={selectedQuestionIndex + 1}
                      showCorrectAnswer={true}
                      isReview={true}
                    />
                    
                    <div className="mt-6 p-4 rounded-lg bg-gray-50">
                      <div className="flex items-start gap-3">
                        {answers[selectedQuestionIndex].isCorrect === true ? (
                          <CheckCircleIcon className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : answers[selectedQuestionIndex].isCorrect === false ? (
                          <XCircleIcon className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <ClockIcon className="h-6 w-6 text-gray-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-1">
                            {answers[selectedQuestionIndex].isCorrect === true ? '回答正确' 
                             : answers[selectedQuestionIndex].isCorrect === false ? '回答错误' 
                             : '待评分/简答'}
                          </div>
                          <div className="text-sm text-gray-600">
                            得分：{answers[selectedQuestionIndex].score ?? 'N/A'} / {answers[selectedQuestionIndex].question.points}
                          </div>
                          {answers[selectedQuestionIndex].question.explanation && (
                            <div className="mt-2 pt-2 border-t">
                               <p className="text-sm font-semibold text-gray-700">解析：</p>
                               <div className="prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{__html: answers[selectedQuestionIndex].question.explanation}}/>
                            </div>
                          )}
                           {answers[selectedQuestionIndex].feedback && ( 
                            <div className="mt-2 pt-2 border-t">
                               <p className="text-sm font-semibold text-gray-700">AI反馈：</p>
                               <div className="prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{__html: answers[selectedQuestionIndex].feedback}}/>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p>没有找到答题记录。</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
