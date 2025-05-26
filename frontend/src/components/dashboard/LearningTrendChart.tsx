import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { cn } from '@/utils/cn'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface TrendDataPoint {
  date: string
  duration: number
  count: number
}

interface LearningTrendChartProps {
  data: TrendDataPoint[]
  className?: string
  height?: number
}

export const LearningTrendChart: React.FC<LearningTrendChartProps> = ({
  data,
  className,
  height = 300,
}) => {
  const formatXAxis = (tickItem: string) => {
    return format(new Date(tickItem), 'MM/dd', { locale: zhCN })
  }

  const formatTooltip = (value: number, name: string) => {
    if (name === 'duration') {
      const hours = Math.floor(value / 60)
      const minutes = value % 60
      return [`${hours}小时${minutes}分钟`, '学习时长']
    }
    return [value, '学习次数']
  }

  return (
    <div className={cn('bg-white p-6 rounded-lg shadow-sm border border-gray-200', className)}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">学习趋势</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxis}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            label={{ value: '分钟', angle: -90, position: 'insideLeft' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            label={{ value: '次数', angle: 90, position: 'insideRight' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
            }}
            formatter={formatTooltip}
            labelFormatter={(label) => format(new Date(label), 'yyyy年MM月dd日', { locale: zhCN })}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="duration"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
            name="学习时长"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="count"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="学习次数"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
