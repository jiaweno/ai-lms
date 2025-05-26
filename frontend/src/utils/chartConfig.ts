// Chart.js Global Configuration (Optional)
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

Chart.defaults.font.family = "'Inter', sans-serif"
Chart.defaults.font.size = 12
Chart.defaults.color = '#6b7280' // text-gray-500

// Recharts Default Props (Example - apply these directly in components)
export const rechartsDefaultProps = {
  chart: {
    margin: { top: 20, right: 30, left: 0, bottom: 0 },
  },
  xAxis: {
    stroke: '#9ca3af', // text-gray-400
    tickLine: false,
    axisLine: false,
  },
  yAxis: {
    stroke: '#9ca3af', // text-gray-400
    tickLine: false,
    axisLine: false,
  },
  tooltip: {
    contentStyle: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb', // border-gray-200
      borderRadius: '0.375rem', // rounded-md
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // shadow-lg
    },
    labelStyle: {
      color: '#1f2937', // text-gray-800
      fontWeight: '500',
    },
  },
  legend: {
    wrapperStyle: {
      paddingTop: '20px',
    },
    textStyle: {
      color: '#4b5563', // text-gray-600
    },
  },
  grid: {
    stroke: '#e5e7eb', // border-gray-200
    strokeDasharray: '3 3',
  },
  colors: [
    '#3b82f6', // primary-500
    '#10b981', // green-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#6366f1', // indigo-500
  ],
}

// Helper to get color by index
export const getColor = (index: number) => {
  return rechartsDefaultProps.colors[index % rechartsDefaultProps.colors.length]
}
