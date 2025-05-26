import React from 'react'
import { cn } from '@/utils/cn'

interface TrueFalseQuestionProps {
  question: {
    id: string
    options?: Array<{ // Options should ideally define the "True" and "False" choices with their correct status
      id: string
      content: string 
      isCorrect?: boolean 
    }>
  }
  answer?: string // Stores the selected option's ID (e.g., 'true_option_id' or 'false_option_id')
  onAnswerChange: (answer: string) => void
  showCorrectAnswer?: boolean
  disabled?: boolean
}

export const TrueFalseQuestion: React.FC<TrueFalseQuestionProps> = ({
  question,
  answer,
  onAnswerChange,
  showCorrectAnswer = false,
  disabled = false,
}) => {
  // Assuming options are provided in a specific order or can be identified
  // For simplicity, let's assume the first option is "True" and the second is "False"
  // Or better, the backend provides clear identifiers for "True" and "False" options.
  // If options are like [{id: "opt1", content: "True", isCorrect: true}, {id: "opt2", content: "False", isCorrect: false}]
  const trueOption = question.options?.find(opt => opt.content.toLowerCase() === 'true' || opt.content === '正确');
  const falseOption = question.options?.find(opt => opt.content.toLowerCase() === 'false' || opt.content === '错误');

  // Fallback if options are not structured as expected
  const optionsToRender = (trueOption && falseOption) 
    ? [trueOption, falseOption] 
    : (question.options && question.options.length >= 2 ? [question.options[0], question.options[1]] : [
        { id: 'fallback_true', content: '正确', isCorrect: undefined },
        { id: 'fallback_false', content: '错误', isCorrect: undefined }
    ]);


  const getOptionClassName = (optionId: string, isOptionCorrect?: boolean) => {
    const base = 'relative border rounded-lg p-4 cursor-pointer transition-all hover:bg-gray-50 flex items-center justify-center min-h-[60px]'
    const isSelected = answer === optionId
    
    if (disabled && showCorrectAnswer) { 
      if (isOptionCorrect) return cn(base, 'border-green-500 bg-green-50 text-green-700')
      if (isSelected && !isOptionCorrect) return cn(base, 'border-red-500 bg-red-50 text-red-700')
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
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        请判断以下说法是否正确
      </div>
      <div className="grid grid-cols-2 gap-4">
        {optionsToRender.map((option) => (
          <label
            key={option.id}
            className={getOptionClassName(option.id, option.isCorrect)}
          >
            <div className="text-center">
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option.id} 
                checked={answer === option.id}
                onChange={(e) => !disabled && onAnswerChange(e.target.value)}
                disabled={disabled}
                className="sr-only"
              />
              <div className="text-lg font-medium text-gray-900">
                {option.content}
              </div>
              {disabled && showCorrectAnswer && option.isCorrect && (
                <div className="text-green-600 text-sm font-medium mt-1">
                  ✓ 正确答案
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
