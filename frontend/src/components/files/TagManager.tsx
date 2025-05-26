import React, { useState, useEffect } from 'react'
import { TagIcon, PlusCircleIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge' // Assuming you have a Badge component
import toast from 'react-hot-toast'
// import { apiService } from '@/utils/api'; // If tags are managed via backend

interface Tag {
  id: string
  name: string
  color?: string
}

interface TagManagerProps {
  selectedTags: string[] // Array of tag IDs or names
  onSelectedTagsChange: (tags: string[]) => void
  className?: string
  allowCreate?: boolean // Whether to allow creating new tags
}

// Mock service for tag management if not using a backend
const mockTagService = {
  getTags: async (): Promise<Tag[]> => {
    return [
      { id: 'tag1', name: '重要', color: 'bg-red-500' },
      { id: 'tag2', name: '学习资料', color: 'bg-blue-500' },
      { id: 'tag3', name: '项目文件', color: 'bg-green-500' },
      { id: 'tag4', name: '待办', color: 'bg-yellow-500' },
    ];
  },
  createTag: async (name: string): Promise<Tag> => {
    return { id: `tag-${Date.now()}`, name, color: 'bg-gray-500' };
  },
};

export const TagManager: React.FC<TagManagerProps> = ({
  selectedTags,
  onSelectedTagsChange,
  className,
  allowCreate = true,
}) => {
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    setIsLoading(true)
    try {
      // const tags = await apiService.get('/tags'); // Replace with actual API call
      const tags = await mockTagService.getTags()
      setAllTags(tags)
    } catch (error) {
      toast.error('加载标签失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTagToggle = (tagId: string) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter(t => t !== tagId)
      : [...selectedTags, tagId]
    onSelectedTagsChange(newSelectedTags)
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim() || !allowCreate) return
    
    const existingTag = allTags.find(tag => tag.name.toLowerCase() === newTagName.trim().toLowerCase())
    if (existingTag) {
      toast.error('该标签已存在')
      return
    }

    setIsLoading(true)
    try {
      // const newTag = await apiService.post('/tags', { name: newTagName.trim() }); // Replace
      const newTag = await mockTagService.createTag(newTagName.trim())
      setAllTags(prev => [...prev, newTag])
      onSelectedTagsChange([...selectedTags, newTag.id]) // Automatically select new tag
      setNewTagName('')
      toast.success(`标签 "${newTag.name}" 创建成功`)
    } catch (error) {
      toast.error('创建标签失败')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Placeholder for delete/edit functionality if needed
  const handleDeleteTag = (tagId: string) => {
    // Call API to delete tag, then update allTags and selectedTags
    toast.info(`删除标签 ${tagId} (功能待实现)`)
  }

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag)
    // Implement inline editing or modal
    toast.info(`编辑标签 ${tag.name} (功能待实现)`)
  }


  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        标签管理
      </label>
      
      {/* Existing Tags */}
      <div className="flex flex-wrap gap-2 mb-4 p-3 border rounded-md bg-white">
        {isLoading && <p className="text-xs text-gray-500">加载标签中...</p>}
        {allTags.map(tag => (
          <Badge
            key={tag.id}
            variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
            className={`cursor-pointer ${tag.color || 'bg-gray-200'}`}
            onClick={() => handleTagToggle(tag.id)}
          >
            {tag.name}
            {/* Edit/Delete buttons (optional) */}
            {/* <PencilIcon className="h-3 w-3 ml-1.5 opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleEditTag(tag); }} /> */}
            {/* <TrashIcon className="h-3 w-3 ml-1 opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleDeleteTag(tag.id); }} /> */}
          </Badge>
        ))}
        {allTags.length === 0 && !isLoading && (
          <p className="text-xs text-gray-500">暂无可用标签</p>
        )}
      </div>

      {/* Create New Tag */}
      {allowCreate && (
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="输入新标签名称"
            className="flex-grow"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
          />
          <Button
            onClick={handleCreateTag}
            disabled={isLoading || !newTagName.trim()}
            icon={PlusCircleIcon}
            size="sm"
          >
            添加标签
          </Button>
        </div>
      )}
    </div>
  )
}

// Simple Badge component if you don't have one
// You might want to create this in its own file: src/components/ui/Badge.tsx
// const Badge: React.FC<{ variant?: 'default' | 'outline', className?: string, children: React.ReactNode, onClick?: () => void }> = 
//   ({ variant = 'default', className, children, onClick }) => {
//   return (
//     <span
//       onClick={onClick}
//       className={cn(
//         'px-2.5 py-0.5 rounded-full text-xs font-medium',
//         variant === 'default' ? 'bg-primary-600 text-white' : 'border border-gray-300 text-gray-700',
//         className
//       )}
//     >
//       {children}
//     </span>
//   )
// }
