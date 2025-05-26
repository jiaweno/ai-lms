import React, { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, FunnelIcon, TagIcon } from '@heroicons/react/24/outline'
import { Input } from '@/components/ui/Input' // Assuming you have an Input component
import { Button } from '@/components/ui/Button' // Assuming you have a Button component
// import { apiService } from '@/utils/api' // If categories/tags are fetched from backend

interface FileFiltersProps {
  filters: {
    search: string
    type: string
    category: string
    tag: string
  }
  onFiltersChange: (filters: any) => void
}

// Mock data - replace with API call if needed
const mockCategories = [
  { id: 'cat1', name: '文档' },
  { id: 'cat2', name: '图片' },
  { id: 'cat3', name: '视频' },
  { id: 'cat4', name: '音频' },
]

const mockTags = [
  { id: 'tag1', name: '重要' },
  { id: 'tag2', name: '学习资料' },
  { id: 'tag3', name: '项目文件' },
]

export const FileFilters: React.FC<FileFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const [categories, setCategories] = useState(mockCategories)
  const [tags, setTags] = useState(mockTags)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // useEffect(() => {
  //   // Fetch categories and tags from backend if needed
  //   // const fetchFilterData = async () => {
  //   //   const [catRes, tagRes] = await Promise.all([
  //   //     apiService.get('/files/categories'),
  //   //     apiService.get('/files/tags'),
  //   //   ]);
  //   //   setCategories([{ id: '', name: '所有分类' }, ...catRes.data]);
  //   //   setTags([{ id: '', name: '所有标签' }, ...tagRes.data]);
  //   // };
  //   // fetchFilterData();
  // }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
      {/* Basic Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Input
            name="search"
            value={filters.search}
            onChange={handleInputChange}
            placeholder="搜索文件名或描述..."
            className="pl-10"
            icon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          icon={FunnelIcon}
        >
          {showAdvanced ? '隐藏高级筛选' : '高级筛选'}
        </Button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          {/* Type Filter */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              文件类型
            </label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleInputChange}
              className="w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="">所有类型</option>
              <option value="image">图片</option>
              <option value="document">文档</option>
              <option value="video">视频</option>
              <option value="audio">音频</option>
              <option value="archive">压缩包</option>
              <option value="other">其他</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              分类
            </label>
            <select
              id="category"
              name="category"
              value={filters.category}
              onChange={handleInputChange}
              className="w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="">所有分类</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Tag Filter */}
          <div>
            <label htmlFor="tag" className="block text-sm font-medium text-gray-700 mb-1">
              标签
            </label>
            <select
              id="tag"
              name="tag"
              value={filters.tag}
              onChange={handleInputChange}
              className="w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="">所有标签</option>
              {tags.map(tag => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
