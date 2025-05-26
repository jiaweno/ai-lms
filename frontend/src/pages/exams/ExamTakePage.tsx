import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { examService } from '@/services/examService'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { QuestionRenderer } from '@/components/exams/QuestionRenderer'
import { ExamTimer } from '@/components/exams/ExamTimer'
import { ExamNavigation } from '@/components/exams/ExamNavigation'
import { SubmitExamModal } from '@/components/exams/SubmitExamModal'
import { ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function ExamTakePage() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  
  const [exam, setExam] = useState<any>(null)
  const [examRecord, setExamRecord] = useState<any>(null) // This will store the current attempt record
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({}) // Keyed by question.id
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  const loadExamAndRecord = useCallback(async () => {
    if (!examId) return;
    setIsLoading(true);
    try {
      const examDetails = await examService.getExamDetails(examId);
      setExam(examDetails);

      // Attempt to get an IN_PROGRESS record or start a new one
      let currentRecord = await examService.getExamRecord(examId); // This might need userId if your service requires it
      if (!currentRecord || currentRecord.status !== 'IN_PROGRESS') {
        currentRecord = await examService.startExam(examId);
      }
      setExamRecord(currentRecord);

      if (currentRecord?.answers) {
        const existingAnswers = currentRecord.answers.reduce((acc: any, ans: any) => {
          acc[ans.questionId] = ans.content;
          return acc;
        }, {});
        setAnswers(existingAnswers);
      }

      if (examDetails.timeLimit && currentRecord) {
        const now = new Date().getTime();
        const startedAt = new Date(currentRecord.startedAt).getTime();
        const elapsedTime = Math.floor((now - startedAt) / 1000);
        const remaining = (examDetails.timeLimit * 60) - elapsedTime;
        setTimeRemaining(Math.max(0, remaining));
      } else if (examDetails.timeLimit) {
         setTimeRemaining(examDetails.timeLimit * 60);
      }

    } catch (err: any) {
      toast.error(err.message || '加载考试失败');
      navigate('/exams');
    } finally {
      setIsLoading(false);
    }
  }, [examId, navigate]);

  useEffect(() => {
    loadExamAndRecord();
  }, [loadExamAndRecord]);

  const handleAnswerChange = useCallback(async (questionId: string, answerValue: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerValue }));
    
    if (!examRecord?.id) {
      toast.error("考试记录不存在，无法保存答案。");
      return;
    }
    setIsSaving(true);
    try {
      // Pass examRecord.id to identify the specific attempt
      await examService.submitAnswer(examRecord.id, questionId, { 
        questionId, // This might be redundant if endpoint takes questionId from URL or structure
        content: answerValue,
        // timeSpent could be calculated here if needed
      });
      // toast.success("答案已自动保存", { duration: 1500 });
    } catch (err: any) {
      console.error('Failed to save answer:', err);
      toast.error('自动保存答案失败');
    } finally {
      setIsSaving(false);
    }
  }, [examRecord?.id]);

  const handleNavigateQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleNextQuestion = () => {
    if (exam && currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitExam = async () => {
    if (!examRecord?.id) {
      toast.error("无法提交：无有效考试记录。");
      return;
    }
    setShowSubmitModal(false); // Close modal before submitting
    setIsLoading(true); // Show loading state for submission
    try {
      // Ensure all current answers are sent before finishing
      if(Object.keys(answers).length > 0 && examRecord.id) {
        // This might be redundant if answers are saved on change,
        // but can be a final save attempt.
        // await examService.batchSubmitAnswers(examRecord.id, Object.entries(answers).map(([qId, ansContent]) => ({questionId: qId, content: ansContent })));
      }
      const result = await examService.finishExam(examRecord.id);
      toast.success('考试提交成功！');
      navigate(`/exams/${examId}/result`, { state: { recordId: examRecord.id } }); // Pass recordId to result page
    } catch (err: any) {
      toast.error('提交考试失败: ' + (err.message || '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeUp = () => {
    toast.warning('考试时间已到，将自动提交您的答案。');
    handleSubmitExam();
  };

  if (isLoading && !exam) { // Adjusted loading condition
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!exam || !examRecord) { // If exam or record couldn't be loaded
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert variant="error" showIcon>
          无法加载考试，或没有有效的考试记录。
        </Alert>
         <Button onClick={() => navigate('/exams')} className="mt-4">
          返回考试列表
        </Button>
      </div>
    );
  }

  const currentExamQuestion = exam.questions[currentQuestionIndex];
  if (!currentExamQuestion || !currentExamQuestion.question) {
      return <Alert variant="error">当前题目数据加载错误。</Alert>;
  }
  const currentQuestion = currentExamQuestion.question;
  const totalQuestions = exam.questions.length;
  const answeredCount = Object.keys(answers).filter(key => {
    const answer = answers[key];
    return answer !== undefined && answer !== null && answer !== '' && (!Array.isArray(answer) || answer.length > 0);
  }).length;

  return (
    <>
      <Helmet>
        <title>{exam.title} - 正在考试</title>
      </Helmet>

      <div className="min-h-screen bg-gray-100"> {/* Changed bg color */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-40"> {/* Sticky header */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3"> {/* Reduced padding */}
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 truncate" title={exam.title}>{exam.title}</h1>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500"> {/* Reduced gap and font size */}
                  <span>题目 {currentQuestionIndex + 1}/{totalQuestions}</span>
                  <span className="flex items-center gap-1">
                    <CheckCircleIcon className="h-3 w-3" /> {/* Smaller icon */}
                    已答 {answeredCount} 题
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3"> {/* Reduced gap */}
                {isSaving && (
                  <span className="text-xs text-gray-500 flex items-center">
                    <LoadingSpinner size="sm" className="mr-1" />保存中...
                  </span>
                )}
                {timeRemaining !== null && (
                  <ExamTimer
                    timeRemaining={timeRemaining}
                    onTimeUp={handleTimeUp}
                  />
                )}
                <Button
                  onClick={() => setShowSubmitModal(true)}
                  variant="primary"
                  size="sm" // Smaller button
                >
                  提交考试
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3 order-last lg:order-first"> {/* Question Nav on left for lg screens */}
              <div className="sticky top-20"> {/* Sticky navigation */}
                <ExamNavigation
                  questions={exam.questions}
                  answers={answers}
                  currentIndex={currentQuestionIndex}
                  onNavigate={handleNavigateQuestion}
                />
              </div>
            </div>

            <div className="lg:col-span-9">
              <div className="bg-white rounded-lg shadow p-6 min-h-[calc(100vh-180px)]"> {/* Ensure min height */}
                <QuestionRenderer
                  question={currentQuestion}
                  answer={answers[currentQuestion.id]}
                  onAnswerChange={(answerValue) => handleAnswerChange(currentQuestion.id, answerValue)}
                  questionNumber={currentQuestionIndex + 1}
                />

                <div className="mt-8 pt-6 border-t flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    上一题
                  </Button>
                  
                  <Button
                    variant="primary"
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === totalQuestions - 1}
                  >
                    下一题
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showSubmitModal && (
          <SubmitExamModal
            exam={exam}
            answeredCount={answeredCount}
            totalQuestions={totalQuestions}
            onConfirm={handleSubmitExam}
            onCancel={() => setShowSubmitModal(false)}
          />
        )}
      </div>
    </>
  )
}
