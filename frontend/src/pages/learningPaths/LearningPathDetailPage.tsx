import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { learningPathService } from '@/services/learningPathService'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Alert } from '@/components/ui/Alert'
import { LearningPathHeader } from '@/components/learningPaths/LearningPathHeader'
import { LearningNodeList } from '@/components/learningPaths/LearningNodeList'
import { KnowledgeGraph3D } from '@/components/learningPaths/KnowledgeGraph3D'
import { ProgressTracker } from '@/components/learningPaths/ProgressTracker'
import toast from 'react-hot-toast'
// import { LearningNodeDetail } from '@/components/learningPaths/LearningNodeDetail'; // Assuming this will be created

// Placeholder for LearningNodeDetail if not yet created
const LearningNodeDetail = ({ node, onClose, onComplete }: any) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-2">{node.title}</h3>
        <p className="text-sm text-gray-600 mb-4">{node.description}</p>
        <div className="prose prose-sm max-w-none mb-4" dangerouslySetInnerHTML={{ __html: node.content?.text || '<p>No content available.</p>' }} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>关闭</Button>
          <Button onClick={() => onComplete(true)}>标记完成</Button>
        </div>
      </div>
    </div>
  );
};


export default function LearningPathDetailPage() {
  const { pathId } = useParams<{ pathId: string }>()
  const navigate = useNavigate()
  
  const [path, setPath] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list')
  const [selectedNode, setSelectedNode] = useState<any>(null)

  useEffect(() => {
    if (pathId) {
      loadPath()
    }
  }, [pathId])

  const loadPath = async () => {
    if (!pathId) return;
    try {
      setIsLoading(true);
      const data = await learningPathService.getPathDetails(pathId)
      setPath(data)
    } catch (err: any) {
      setError(err.message || '加载学习路径失败')
      toast.error('加载学习路径失败: ' + (err.message || '未知错误'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnroll = async () => {
    if (!pathId) return;
    try {
      await learningPathService.enrollInPath(pathId)
      await loadPath() // Refresh path details to show enrolled status
      toast.success('成功加入学习路径！')
    } catch (err: any) {
      toast.error('加入失败: ' + (err.message || '未知错误'))
    }
  }

  const handleNodeProgress = async (nodeId: string, completed: boolean) => {
    if (!pathId) return;
    try {
      await learningPathService.updateProgress(pathId, {
        nodeId,
        completed,
        timeSpent: 30, // Mock time spent for now
      })
      await loadPath() // Refresh path to show updated progress
      toast.success(completed ? '节点已完成！' : '进度已更新')
    } catch (err: any) {
      toast.error('更新进度失败: ' + (err.message || '未知错误'))
    }
  }

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />
  }

  if (error || !path) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert variant="error" showIcon>  {/* Corrected prop name */}
          {error || '学习路径不存在'}
        </Alert>
        <Button onClick={() => navigate('/learning-paths')} className="mt-4">
          返回学习路径列表
        </Button>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{path.title} - AI学习管理系统</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <LearningPathHeader
          path={path}
          onEnroll={handleEnroll}
        />

        {/* Progress Tracker */}
        {path.progress?.enrolled && (
          <div className="mt-6">
            <ProgressTracker progress={path.progress} />
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="mt-8 mb-6 flex justify-end gap-2">
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            列表视图
          </Button>
          <Button
            variant={viewMode === 'graph' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('graph')}
          >
            图谱视图
          </Button>
        </div>

        {/* Content */}
        {viewMode === 'list' ? (
          <LearningNodeList
            nodes={path.nodes || []} // Ensure nodes is an array
            progress={path.progress}
            onNodeClick={setSelectedNode}
            onNodeComplete={handleNodeProgress}
          />
        ) : (
          path.knowledgeGraph && path.knowledgeGraph.nodes && path.knowledgeGraph.edges ? (
            <div className="bg-white rounded-lg shadow" style={{ height: '600px' }}>
              <KnowledgeGraph3D
                graph={path.knowledgeGraph}
                progress={path.progress}
                onNodeClick={setSelectedNode}
              />
            </div>
          ) : <p>知识图谱数据不可用。</p>
        )}

        {/* Node Detail Modal */}
        {selectedNode && (
          <LearningNodeDetail
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onComplete={(completed:boolean) => handleNodeProgress(selectedNode.id, completed)}
          />
        )}
      </div>
    </>
  )
}
