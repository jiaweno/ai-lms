import React from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/outline' 
import { cn } from '@/utils/cn'

interface ExamNavigationProps {
  questions: Array<{
    id: string // This is ExamQuestion ID
    question: { // This is the actual Question model
      id: string
      title: string
      type: string 
    }
  }>
  answers: Record<string, any> // Keyed by Question ID
  currentIndex: number
  onNavigate: (index: number) => void
}

export const ExamNavigation: React.FC<ExamNavigationProps> = ({
  questions,
  answers,
  currentIndex,
  onNavigate,
}) => {
  const getQuestionStatus = (questionId: string) => {
    const answer = answers[questionId]
    if (answer === undefined || answer === null || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
      return 'unanswered'
    }
    return 'answered'
  }

  const getQuestionClassName = (index: number, questionId: string) => {
    const status = getQuestionStatus(questionId)
    const isCurrent = index === currentIndex
    
    const base = 'w-10 h-10 rounded-lg border-2 flex items-center justify-center text-sm font-medium cursor-pointer transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
    
    if (isCurrent) {
      return cn(base, 'border-primary-500 bg-primary-100 text-primary-700 ring-primary-500')
    }
    
    if (status === 'answered') {
      return cn(base, 'border-green-500 bg-green-100 text-green-700')
    }
    
    return cn(base, 'border-gray-300 bg-white text-gray-600 hover:border-gray-400')
  }

  const answeredCount = Object.keys(answers).filter(key => {
    const answer = answers[key];
    return answer !== undefined && answer !== null && answer !== '' && (!Array.isArray(answer) || answer.length > 0);
  }).length;
  const totalQuestions = questions.length

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">答题进度</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CheckCircleIcon className="h-4 w-4 text-green-500" />
          <span>已答 {answeredCount} / {totalQuestions} 题</span>
        </div>
        <div className="mt-2 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 rounded-full h-2 transition-all duration-300" 
            style={{ width: totalQuestions > 0 ? `${(answeredCount / totalQuestions) * 100}%` : '0%' }}
          />
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">题目导航</h4>
        <div className="grid grid-cols-5 gap-2">
          {questions.map((examQuestionItem, index) => ( 
            <button
              key={examQuestionItem.id} 
              onClick={() => onNavigate(index)}
              className={getQuestionClassName(index, examQuestionItem.question.id)} 
              title={`第${index + 1}题: ${examQuestionItem.question.title}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-primary-500 bg-primary-100"></div>
            <span className="text-gray-600">当前题目</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-green-500 bg-green-100"></div>
            <span className="text-gray-600">已答题目</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-gray-300 bg-white"></div>
            <span className="text-gray-600">未答题目</span>
          </div>
        </div>
      </div>
    </div>
  )
}
