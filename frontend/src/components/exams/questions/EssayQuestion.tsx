import React from 'react'
import { cn } from '@/utils/cn'

interface EssayQuestionProps {
  question: {
    id: string
    content: any // Example: { text: "Describe..." } or just a string
    explanation?: string // For review mode, the model answer or key points
    // Assuming minWords might be part of metadata or content if needed
    // For example: question.content?.minWords or question.metadata?.minWords
  }
  answer?: string // Stores the user's text input
  onAnswerChange: (answer: string) => void
  showCorrectAnswer?: boolean
  disabled?: boolean
}

export const EssayQuestion: React.FC<EssayQuestionProps> = ({
  question,
  answer = '',
  onAnswerChange,
  showCorrectAnswer = false,
  disabled = false,
}) => {
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  // Attempt to get minWords from content or metadata, default to 50
  const minWords = (typeof question.content === 'object' && question.content?.minWords) || 
                   (typeof (question as any).metadata === 'object' && (question as any).metadata?.minWords) || // Cast to any if metadata is not on type
                   50;

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        请详细阐述您的观点和理由（建议不少于{minWords}字）
      </div>
      
      <div className="relative">
        <textarea
          value={answer}
          onChange={(e) => !disabled && onAnswerChange(e.target.value)}
          disabled={disabled}
          placeholder="请在此输入您的答案..."
          rows={10} 
          className={cn(
            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-vertical',
            disabled && 'bg-gray-50 cursor-not-allowed'
          )}
        />
        
        {!disabled && ( // Only show word count when not disabled (i.e., during active exam taking)
          <div className="absolute bottom-3 right-3 text-xs text-gray-400">
            {wordCount} 字
          </div>
        )}
      </div>
      
      {!disabled && (
        <div className="flex justify-between items-center text-sm">
          <div className={cn(
            'text-gray-500',
            wordCount < minWords && 'text-orange-600',
            wordCount >= minWords && 'text-green-600'
          )}>
            {wordCount < minWords ? `还需 ${minWords - wordCount} 字达到建议字数` : '已达到建议字数'}
          </div>
          <div className="text-gray-400">
            此题将由AI智能评分或教师人工评阅
          </div>
        </div>
      )}
      
      {disabled && showCorrectAnswer && question.explanation && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">参考答案要点：</div>
          <div className="text-sm text-gray-600 whitespace-pre-wrap prose prose-sm max-w-none">
            {/* If explanation is HTML, use dangerouslySetInnerHTML, otherwise render as text */}
            {question.explanation.startsWith('<') ? 
                <div dangerouslySetInnerHTML={{ __html: question.explanation }} /> : 
                <p>{question.explanation}</p>
            }
          </div>
        </div>
      )}
    </div>
  )
}
