import React from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { cn } from '@/utils/cn'

interface RadarDataPoint {
  skill: string
  score: number
  fullScore: number
}

interface LearningRadarChartProps {
  data: RadarDataPoint[]
  className?: string
  height?: number
}

export const LearningRadarChart: React.FC<LearningRadarChartProps> = ({
  data,
  className,
  height = 300,
}) => {
  return (
    <div className={cn('bg-white p-6 rounded-lg shadow-sm border border-gray-200', className)}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">技能掌握度</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data}>
          <PolarGrid 
            gridType="polygon" 
            radialLines={false}
            stroke="#e5e7eb"
          />
          <PolarAngleAxis 
            dataKey="skill" 
            tick={{ fontSize: 12 }}
            className="text-gray-600"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
            axisLine={false}
          />
          <Radar
            name="当前水平"
            dataKey="score"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
            }}
            formatter={(value: number) => `${value}%`}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
