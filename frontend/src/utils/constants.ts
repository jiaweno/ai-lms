export const APP_CONFIG = {
  APP_NAME: 'AI学习管理系统',
  VERSION: '1.0.0',
  API_VERSION: 'v1',
  
  // File upload limits
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
  ],
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  
  // Timeouts
  REQUEST_TIMEOUT: 10000,
  
  // Routes
  ROUTES: {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    PROFILE: '/profile',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    // Add more routes as needed
  },

  // Roles
  ROLES: {
    ADMIN: 'ADMIN',
    TEACHER: 'TEACHER',
    STUDENT: 'STUDENT',
  },

  // Permissions (example, define based on your needs)
  PERMISSIONS: {
    MANAGE_USERS: 'manage_users',
    CREATE_COURSE: 'create_course',
    VIEW_REPORTS: 'view_reports',
    UPLOAD_FILES: 'upload_files',
    ACCESS_AI_TOOLS: 'access_ai_tools',
  },
}
