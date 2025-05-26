import React from 'react'
import { SingleChoiceQuestion } from './questions/SingleChoiceQuestion'
import { MultipleChoiceQuestion } from './questions/MultipleChoiceQuestion'
import { TrueFalseQuestion } from './questions/TrueFalseQuestion'
import { FillBlankQuestion } from './questions/FillBlankQuestion'
import { EssayQuestion } from './questions/EssayQuestion'

interface QuestionRendererProps {
  question: {
    id: string
    title: string
    content: any // Can be string or an object for rich text
    type: string
    points: number
    timeLimit?: number
    options?: Array<{
      id: string
      content: string
      order: number
      isCorrect?: boolean // For review mode
    }>
  }
  answer?: any
  onAnswerChange: (answer: any) => void
  questionNumber: number
  showCorrectAnswer?: boolean
  isReview?: boolean
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  answer,
  onAnswerChange,
  questionNumber,
  showCorrectAnswer = false,
  isReview = false,
}) => {
  const renderQuestionByType = () => {
    const commonProps = {
      question,
      answer,
      onAnswerChange,
      showCorrectAnswer,
      disabled: isReview, // In review mode, inputs should be disabled
    }

    switch (question.type) {
      case 'SINGLE_CHOICE':
        return <SingleChoiceQuestion {...commonProps} />
      
      case 'MULTIPLE_CHOICE':
        // Ensure answer is an array for multiple choice
        commonProps.answer = Array.isArray(commonProps.answer) ? commonProps.answer : [];
        return <MultipleChoiceQuestion {...commonProps} />
      
      case 'TRUE_FALSE':
        return <TrueFalseQuestion {...commonProps} />
      
      case 'FILL_BLANK':
        commonProps.answer = typeof commonProps.answer === 'string' ? commonProps.answer : '';
        return <FillBlankQuestion {...commonProps} />
      
      case 'ESSAY':
        commonProps.answer = typeof commonProps.answer === 'string' ? commonProps.answer : '';
        return <EssayQuestion {...commonProps} />
      
      default:
        return <div>不支持的题目类型: {question.type}</div>
    }
  }

  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-sm font-medium">
              {questionNumber}
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{question.points} 分</span>
              {question.timeLimit && (
                <span>• 建议用时 {question.timeLimit} 秒</span>
              )}
            </div>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {question.title}
          </h3>
          
          {/* Question Content */}
          {question.content && (
            <div className="prose prose-sm max-w-none mb-6">
              {typeof question.content === 'string' ? (
                <p>{question.content}</p>
              ) : (
                // Assuming question.content might be an object like { text: "...", html: "..." }
                question.content.html 
                  ? <div dangerouslySetInnerHTML={{ __html: question.content.html }} />
                  : <p>{question.content.text || ''}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Question Input */}
      {renderQuestionByType()}
    </div>
  )
}
