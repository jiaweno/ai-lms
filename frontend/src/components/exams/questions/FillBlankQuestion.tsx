import React from 'react'
import { cn } from '@/utils/cn'

interface FillBlankQuestionProps {
  question: {
    id: string
    content: any // Example: { text_before_blank: "The capital of France is ", text_after_blank: "." } or just a string with "____"
    options?: Array<{ // Options can store correct answers for review
      id: string
      content: string 
      isCorrect?: boolean 
    }>
  }
  answer?: string // Stores the user's text input
  onAnswerChange: (answer: string) => void
  showCorrectAnswer?: boolean
  disabled?: boolean
}

// Basic Input component if not already globally available
// Consider moving to a shared ui directory if used elsewhere
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {className?: string}> = ({ className, ...props }) => {
  return (
    <input
      {...props}
      className={cn(
        "block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm",
        className
      )}
    />
  );
};

export const FillBlankQuestion: React.FC<FillBlankQuestionProps> = ({
  question,
  answer = '',
  onAnswerChange,
  showCorrectAnswer = false,
  disabled = false,
}) => {
  const correctAnswers = question.options?.filter(opt => opt.isCorrect).map(opt => opt.content) || []
  const isCorrect = showCorrectAnswer && correctAnswers.some(correct => 
    correct.toLowerCase().trim() === (answer || '').toLowerCase().trim()
  )

  // Handle different content structures for fill-in-the-blank
  let questionParts: (string | null)[] = [];
  if (typeof question.content === 'string') {
    questionParts = question.content.split('____');
  } else if (question.content && typeof question.content.text === 'string') {
    questionParts = question.content.text.split('____');
  } else if (question.content && question.content.text_before_blank) { // Compatibility with older structure
    questionParts = [question.content.text_before_blank, question.content.text_after_blank || null];
  } else {
    questionParts = ["Error: Question content not formatted correctly.", null];
  }


  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        请在下方输入框中填写答案
      </div>
      
      <div className="flex flex-wrap items-center gap-2"> {/* Changed to flex-wrap */}
        {questionParts.map((part, index) => (
          <React.Fragment key={index}>
            {part && <p className="text-gray-900">{part}</p>}
            {index < questionParts.length - 1 && ( // Don't render input after the last part
              <Input
                type="text"
                value={answer} // Assuming single blank for now; multiple blanks would need array of answers
                onChange={(e) => !disabled && onAnswerChange(e.target.value)}
                disabled={disabled}
                placeholder="请输入答案"
                className={cn(
                  'flex-grow px-3 py-2 border rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 min-w-[100px] sm:min-w-[150px]', // Adjusted min-width
                  disabled && 'bg-gray-50 cursor-not-allowed',
                  showCorrectAnswer && isCorrect && 'border-green-500 bg-green-50 text-green-700',
                  showCorrectAnswer && !isCorrect && answer && 'border-red-500 bg-red-50 text-red-700'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      
      {showCorrectAnswer && (
        <div className="mt-3 p-3 bg-gray-100 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-1">参考答案：</div>
          <div className="text-sm text-gray-600">
            {correctAnswers.join(' 或 ')}
          </div>
        </div>
      )}
      
      {answer && !disabled && (
        <div className="text-xs text-gray-500">
          已输入 {answer.length} 个字符
        </div>
      )}
    </div>
  )
}
