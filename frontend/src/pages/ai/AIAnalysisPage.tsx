import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { aiService } from '@/services/aiService'
import { fileService } from '@/services/fileService' // Assuming you have fileService
import { learningPathService } from '@/services/learningPathService'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Alert } from '@/components/ui/Alert'
import { AnalysisProgress } from '@/components/ai/AnalysisProgress'
import { KnowledgePointsList } from '@/components/ai/KnowledgePointsList'
import { LearningPathPreview } from '@/components/ai/LearningPathPreview'
import { DocumentTextIcon, SparklesIcon } from '@heroicons/react/24/outline' // Corrected import
import toast from 'react-hot-toast'

export default function AIAnalysisPage() {
  const { fileId } = useParams<{ fileId: string }>()
  const navigate = useNavigate()
  
  const [file, setFile] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [selectedPath, setSelectedPath] = useState<any>(null) // For viewing details of a path
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (fileId) {
      loadFile()
    }
  }, [fileId])

  const loadFile = async () => {
    if (!fileId) return;
    try {
      const fileData = await fileService.getFile(fileId) // Use fileService
      setFile(fileData)
    } catch (err: any) {
      setError('无法加载文件信息')
      toast.error('加载文件失败')
    }
  }

  const startAnalysis = async () => {
    if (!fileId) return
    
    setIsAnalyzing(true)
    setError(null)
    setAnalysisProgress(0)
    setAnalysisResult(null); // Clear previous results
    
    try {
      const initialResponse = await aiService.analyzeDocument({ // Corrected service call
        fileId,
        options: {
          generatePaths: true,
          extractKeywords: true,
          analyzeDepth: 'detailed',
        }
      })

      if (initialResponse.jobId) {
        // Poll for analysis completion
        const result = await aiService.waitForAnalysis(initialResponse.jobId, setAnalysisProgress)
        setAnalysisResult(result)
        toast.success('AI分析完成！')
      } else if (initialResponse.results) {
        // If results are returned directly (e.g. from cache)
        setAnalysisResult(initialResponse.results);
        setAnalysisProgress(100);
        toast.success('AI分析已加载！');
      } else {
        throw new Error("Invalid response from analysis service.");
      }

    } catch (err: any) {
      setError(err.message || 'AI分析失败，请稍后重试')
      toast.error('分析失败: ' + (err.message || '未知错误'))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const createLearningPath = async (path: any) => {
    if (!fileId || !analysisResult?.analysisId) {
        toast.error("无法创建路径：缺少文件ID或分析ID。");
        return;
    }
    try {
      const result = await learningPathService.createPath({
        title: path.title,
        description: path.description,
        fileId: fileId, // Pass fileId
        analysisId: analysisResult.analysisId, // Pass analysisId from result
        nodes: path.nodes,
      })
      
      toast.success('学习路径创建成功！')
      navigate(`/learning-paths/${result.data.path.id}`)
    } catch (err: any) {
      toast.error('创建学习路径失败: ' + (err.message || '未知错误'))
    }
  }

  if (!fileId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert variant="info"> {/* Corrected prop name */}
          请先选择一个文档进行AI分析
        </Alert>
        <Button
          onClick={() => navigate('/files')}
        //   icon={DocumentTextIcon} // Corrected icon usage
          className="mt-4"
        >
          选择文档
        </Button>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>AI文档分析 - AI学习管理系统</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <SparklesIcon className="h-8 w-8 text-primary-600" />
            AI文档分析
          </h1>
          <p className="mt-2 text-gray-600">
            使用AI智能分析文档内容，提取知识点并生成个性化学习路径
          </p>
        </div>

        {file && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-2">文档信息</h2>
            <div className="text-sm text-gray-600">
              <p>文件名：{file.originalName}</p>
              <p>大小：{file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}</p>
              <p>类型：{file.mimetype}</p>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="error" showIcon className="mb-6"> {/* Corrected prop name */}
            {error}
          </Alert>
        )}

        {!analysisResult && !isAnalyzing && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <SparklesIcon className="h-16 w-16 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">开始AI分析</h3>
            <p className="text-gray-600 mb-6">
              AI将分析文档内容，提取关键知识点，并为您生成最适合的学习路径
            </p>
            <Button
              onClick={startAnalysis}
            //   variant="primary" // Assuming Button has variant prop
              size="lg"
            //   icon={SparklesIcon}
            >
              开始分析
            </Button>
          </div>
        )}

        {isAnalyzing && (
          <AnalysisProgress progress={analysisProgress} />
        )}

        {analysisResult && (
          <div className="space-y-8">
            {analysisResult.knowledgePoints && analysisResult.knowledgePoints.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">提取的知识点</h2>
                <KnowledgePointsList 
                  knowledgePoints={analysisResult.knowledgePoints} 
                />
              </div>
            )}

            {analysisResult.suggestedPaths && analysisResult.suggestedPaths.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">推荐学习路径</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {analysisResult.suggestedPaths.map((path: any, index: number) => (
                    <LearningPathPreview
                      key={index}
                      path={path}
                      onSelect={() => setSelectedPath(path)} // Placeholder for viewing path details
                      onCreatePath={() => createLearningPath(path)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
