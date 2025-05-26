import React from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
// Assuming Input component is available from ui folder
// import { Input } from '@/components/ui/Input'; 

interface ExamFiltersProps {
  filters: {
    type: string
    status: string
    search: string
  }
  onFiltersChange: (filters: any) => void
}

const examTypes = [
  { value: '', label: '全部类型' },
  { value: 'CHAPTER_TEST', label: '章节测试' },
  { value: 'MOCK_EXAM', label: '模拟考试' },
  { value: 'REAL_EXAM', label: '真题考试' },
  { value: 'PRACTICE', label: '练习模式' },
]

const examStatuses = [
  { value: '', label: '全部状态' },
  { value: 'PUBLISHED', label: '已发布' },
  { value: 'ACTIVE', label: '进行中' },
  { value: 'ENDED', label: '已结束' },
  // DRAFT and CANCELLED might be more for admin views
]

export const ExamFilters: React.FC<ExamFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      [e.target.name]: e.target.value,
    })
  }
  
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg border">
      {/* Search */}
      <div className="flex-1">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            name="search" // Added name attribute
            value={filters.search}
            onChange={handleInputChange}
            placeholder="搜索考试..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Type Filter */}
      <select
        name="type" // Added name attribute
        value={filters.type}
        onChange={handleInputChange}
        className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
      >
        {examTypes.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>

      {/* Status Filter */}
      <select
        name="status" // Added name attribute
        value={filters.status}
        onChange={handleInputChange}
        className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
      >
        {examStatuses.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
    </div>
  )
}
