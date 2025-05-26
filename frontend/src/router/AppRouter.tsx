import { Routes, Route } from 'react-router-dom' // Removed Navigate as it's unused in this version
import { Suspense, lazy } from 'react'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Alert } from '@/components/ui/Alert'; 

// Lazy load pages
const Home = lazy(() => import('@/pages/Home'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const UserProfilePage = lazy(() => import('@/pages/UserProfilePage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage')) 
const FilesPage = lazy(() => import('@/pages/files/FilesPage'))
const AIAnalysisPage = lazy(() => import('@/pages/ai/AIAnalysisPage'))
const LearningPathsPage = lazy(() => import('@/pages/learningPaths/LearningPathsPage'))
const LearningPathDetailPage = lazy(() => import('@/pages/learningPaths/LearningPathDetailPage'))

// Exam related pages from DAY6
const ExamsPage = lazy(() => import('@/pages/exams/ExamsPage'))
const ExamTakePage = lazy(() => import('@/pages/exams/ExamTakePage'))
const ExamResultPage = lazy(() => import('@/pages/exams/ExamResultPage'))
const QuestionsPage = lazy(() => import('@/pages/questions/QuestionsPage')) 
const CreateQuestionPage = lazy(() => import('@/pages/questions/CreateQuestionPage')) 
const CreateExamPage = lazy(() => import('@/pages/exams/CreateExamPage')) 

const NotFoundPage = lazy(() => import('@/pages/NotFoundPage')) 

export const AppRouter = () => {
  return (
    <Suspense fallback={<LoadingSpinner className="min-h-screen" />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          
          {/* Auth Routes */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password/:token" element={<ResetPasswordPage />} />

          {/* Protected Routes */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute requireAuth>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute requireAuth>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="files"
            element={
              <ProtectedRoute requireAuth>
                <FilesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="files/:fileId/analyze"
            element={
              <ProtectedRoute requireAuth requiredRoles={['TEACHER', 'ADMIN']}> 
                <AIAnalysisPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="learning-paths"
            element={
              <ProtectedRoute requireAuth>
                <LearningPathsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="learning-paths/:pathId"
            element={
              <ProtectedRoute requireAuth>
                <LearningPathDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Exam System Routes from DAY6 */}
          <Route
            path="exams"
            element={
              <ProtectedRoute requireAuth>
                <ExamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="exams/create"
            element={
              <ProtectedRoute requireAuth requiredRoles={['TEACHER', 'ADMIN']}>
                <CreateExamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="exams/:examId/take" 
            element={
              <ProtectedRoute requireAuth>
                <ExamTakePage />
              </ProtectedRoute>
            }
          />
           <Route
            path="exams/:examId/result" 
            element={
              <ProtectedRoute requireAuth>
                <ExamResultPage />
              </ProtectedRoute>
            }
          />

          {/* Question Bank Routes from DAY6 */}
          <Route
            path="questions"
            element={
              <ProtectedRoute requireAuth requiredRoles={['TEACHER', 'ADMIN']}>
                <QuestionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="questions/create"
            element={
              <ProtectedRoute requireAuth requiredRoles={['TEACHER', 'ADMIN']}>
                <CreateQuestionPage />
              </ProtectedRoute>
            }
          />
          {/* Add route for editing question: /questions/:questionId/edit */}


          {/* Admin Routes (Example) */}
          <Route
            path="admin/users"
            element={
              <ProtectedRoute requireAuth requiredRoles={['ADMIN']}>
                <div>用户管理页面 (仅限管理员)</div> {/* Replace with actual component */}
              </ProtectedRoute>
            }
          />

          {/* Fallback for unmatched routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
