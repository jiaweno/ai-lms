import { PrismaClient } from '@prisma/client'
import { seedBasicData } from './seedBasic' // Assuming seedBasic exists
import { seedDashboardData } from './seedDashboard'
import { seedAIData } from './seedAI'
import { seedExamData } from './seedExams' // Added in DAY6

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting database seeding...')
  
  // Basic data (users, roles, etc.)
  // It's important that seedBasicData includes the users referenced in other seed files
  // e.g., student1@ai-lms.com, teacher@ai-lms.com, admin@ai-lms.com
  await seedBasicData() 
  
  // Dashboard and learning data
  await seedDashboardData()
  
  // AI analysis data
  await seedAIData()
  
  // Exam system data
  await seedExamData() // Added in DAY6
  
  console.log('✅ Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Database seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
