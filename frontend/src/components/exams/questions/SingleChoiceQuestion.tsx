import React from 'react'
import { cn } from '@/utils/cn'

interface SingleChoiceQuestionProps {
  question: {
    id: string
    options?: Array<{
      id: string
      content: string
      isCorrect?: boolean // For review mode
    }>
  }
  answer?: string // Stores the ID of the selected option
  onAnswerChange: (answer: string) => void
  showCorrectAnswer?: boolean
  disabled?: boolean
}

export const SingleChoiceQuestion: React.FC<SingleChoiceQuestionProps> = ({
  question,
  answer,
  onAnswerChange,
  showCorrectAnswer = false,
  disabled = false,
}) => {
  const options = question.options || []

  const getOptionClassName = (optionId: string, isCorrectOption?: boolean) => {
    const base = 'relative border rounded-lg p-4 cursor-pointer transition-all hover:bg-gray-50'
    const isSelected = answer === optionId
    
    if (disabled && showCorrectAnswer) { // Review mode
      if (isCorrectOption) return cn(base, 'border-green-500 bg-green-50 text-green-700')
      if (isSelected && !isCorrectOption) return cn(base, 'border-red-500 bg-red-50 text-red-700')
      return cn(base, 'border-gray-300 opacity-70')
    }
    
    if (disabled) {
      return cn(base, 'cursor-not-allowed opacity-70 bg-gray-50')
    }
    
    if (isSelected) {
      return cn(base, 'border-primary-500 bg-primary-50 ring-2 ring-primary-500')
    }
    
    return cn(base, 'border-gray-300')
  }

  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <label
          key={option.id}
          className={getOptionClassName(option.id, option.isCorrect)}
        >
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name={`question-${question.id}`}
              value={option.id}
              checked={answer === option.id}
              onChange={(e) => !disabled && onAnswerChange(e.target.value)}
              disabled={disabled}
              className="mt-0.5 h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
            />
            <div className="flex-1">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-sm font-medium mr-3">
                {String.fromCharCode(65 + index)} {/* A, B, C... */}
              </span>
              <span className="text-gray-900">{option.content}</span>
            </div>
            
            {disabled && showCorrectAnswer && option.isCorrect && (
              <div className="text-green-600 text-sm font-medium">
                ✓ 正确答案
              </div>
            )}
          </div>
        </label>
      ))}
    </div>
  )
}
