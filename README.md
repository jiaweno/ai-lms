# **AI 学习管理系统 (AI Learning Management System)**

AI 学习管理系统是一个基于现代技术栈构建的、AI 驱动的智能化学习平台。它旨在为用户提供从学习资料管理、个性化学习路径生成到在线测试与评估的全流程智能学习体验。

## **✨ 主要功能**

* **用户认证与管理**: 安全的注册、登录、权限管理 (RBAC)。  
* **仪表盘**: 可视化展示学习进度、统计数据和活动记录。  
* **文件管理**: 支持多种格式学习资料的上传、存储 (MinIO)、预览和管理。  
* **AI 学习路径生成**:  
  * 智能分析上传的文档 (PDF, Word)。  
  * 自动提取知识点，构建知识图谱。  
  * 生成个性化的学习路径和时长预估。  
  * 支持用户编辑和调整学习路径。  
  * 3D 知识图谱可视化。  
* **测试与考试系统**:  
  * 支持多种题型 (单选、多选、判断、填空、简答)。  
  * 题库管理，支持题目批量导入。  
  * 多种考试模式 (章节测试、模拟考、真题)。  
  * 客观题自动评分，主观题 AI 辅助评分。  
  * 详细的成绩分析和错题本。  
* **实时通知系统**: 基于 WebSocket 的实时消息推送。  
* **国际化支持**: 支持中英文切换。  
* **数据导出**: 支持学习报告和考试数据导出 (PDF, Excel)。  
* **性能监控与错误追踪**: 集成 Sentry 进行实时监控。  
* **PWA 支持**: 支持离线访问和添加到主屏幕。

## **🛠️ 技术栈**

### **前端 (Frontend)**

* **框架**: React 18 \+ TypeScript  
* **构建工具**: Vite  
* **样式**: Tailwind CSS \+ Headless UI  
* **状态管理**: Zustand  
* **路由**: React Router v6  
* **图表**: Recharts  
* **表单**: React Hook Form \+ Zod  
* **HTTP客户端**: Axios  
* **国际化**: i18next

### **后端 (Backend)**

* **运行时**: Node.js 18+  
* **框架**: Fastify  
* **语言**: TypeScript  
* **数据库 ORM**: Prisma  
* **身份验证**: JWT \+ bcrypt  
* **文件上传**: Fastify/multipart  
* **AI 集成**: OpenAI API (可配置本地 Ollama)  
* **任务队列**: BullMQ (基于 Redis)

### **数据库与存储 (Database & Storage)**

* **主数据库**: PostgreSQL 15+  
* **缓存**: Redis 7+  
* **文件存储**: MinIO (兼容 AWS S3)

### **部署与运维 (DevOps)**

* **容器化**: Docker \+ Docker Compose  
* **CI/CD**: GitHub Actions  
* **前端部署**: Vercel (推荐)  
* **后端部署**: Railway / Docker 容器部署 (推荐)  
* **CDN**: Cloudflare (推荐)  
* **监控**: Sentry

## **🚀 快速开始**

### **环境要求**

* Node.js \>= 18.x  
* npm \>= 9.x 或 yarn \>= 1.22.x  
* Docker 和 Docker Compose (用于本地开发环境)  
* PostgreSQL \>= 15  
* Redis \>= 7  
* MinIO (或配置 AWS S3)

### **1\. 克隆项目**

git clone \[https://github.com/your-username/ai-lms.git\](https://github.com/your-username/ai-lms.git)  
cd ai-lms

### **2\. 配置环境变量**

项目包含多个 .env.example 文件，请根据您的环境复制并修改它们：

* **根目录**: .env.example \-\> .env (主要用于 Docker Compose)  
* **后端**: backend/.env.example \-\> backend/.env  
* **前端**: frontend/.env.example \-\> frontend/.env

**关键环境变量说明**:

#### backend/.env

\# 应用配置  
NODE\_ENV=development  
PORT=3000  
HOST=0.0.0.0

\# 数据库配置 (重要)  
DATABASE\_URL="postgresql://postgres:password123@localhost:5432/ai\_lms?schema=public" \# 根据实际情况修改

\# Redis配置 (重要)  
REDIS\_URL="redis://localhost:6379"

\# JWT配置 (重要 \- 请生成一个强密钥)  
JWT\_SECRET="your-super-secret-jwt-key-change-this-in-production-minimum-32-characters"  
JWT\_EXPIRES\_IN="7d"  
REFRESH\_TOKEN\_EXPIRES\_IN="30d"

\# 文件存储配置 (MinIO)  
MINIO\_ENDPOINT="localhost"  
MINIO\_PORT=9000  
MINIO\_ACCESS\_KEY="minioadmin"  
MINIO\_SECRET\_KEY="minioadmin123"  
MINIO\_USE\_SSL=false  
MINIO\_BUCKET\_NAME="ai-lms-files" \# 需要在MinIO中手动创建此bucket

\# OpenAI配置 (重要 \- 用于AI功能)  
OPENAI\_API\_KEY="sk-your-openai-api-key"  
OPENAI\_MODEL="gpt-3.5-turbo" \# 或其他兼容模型

\# AI Provider (openai 或 ollama)  
AI\_PROVIDER="openai"  
\# OLLAMA\_BASE\_URL="http://localhost:11434" \# 如果使用Ollama  
\# OLLAMA\_MODEL="llama2"                   \# 如果使用Ollama

\# 任务队列 Redis URL (如果与主Redis不同)  
\# QUEUE\_REDIS\_URL="redis://localhost:6379"

\# CORS配置 (重要 \- 前端访问地址)  
CORS\_ORIGIN="http://localhost:5173"

\# Sentry DSN (可选 \- 用于错误监控)  
SENTRY\_DSN=""

#### frontend/.env

\# 前端API请求的基础URL (重要)  
VITE\_API\_BASE\_URL=http://localhost:3000/api

\# WebSocket连接URL (重要)  
VITE\_WS\_URL=ws://localhost:3000

\# Sentry DSN (可选 \- 用于前端错误监控)  
VITE\_SENTRY\_DSN=""

您可以使用 scripts/setup-env.sh 脚本来辅助创建 .env 文件并生成一个随机的 JWT\_SECRET：

chmod \+x scripts/setup-env.sh  
./scripts/setup-env.sh

之后请务必检查并根据您的实际环境修改这些 .env 文件。

### **3\. 启动本地开发环境 (使用 Docker Compose)**

这是推荐的本地开发方式，可以一键启动所有依赖服务。

docker-compose up \-d

这将启动 PostgreSQL, Redis, 和 MinIO 服务。

* **MinIO 控制台**: 访问 http://localhost:9001 (用户: minioadmin, 密码: minioadmin123)。请手动创建一个名为 ai-lms-files (或您在 .env 中配置的名称) 的 bucket。

### **4\. 安装依赖**

分别进入 frontend 和 backend 目录安装依赖：

\# 安装后端依赖  
cd backend  
npm install  
cd ..

\# 安装前端依赖  
cd frontend  
npm install  
cd ..

### **5\. 数据库设置 (后端)**

进入 backend 目录操作：

cd backend

\# 1\. 生成 Prisma Client  
npm run db:generate

\# 2\. 应用数据库迁移 (创建表结构)  
npm run db:migrate

\# 3\. 填充初始数据 (可选，但推荐)  
npm run db:seed  
\# 如果需要填充AI和考试相关的种子数据，可以运行：  
\# npm run db:seed:ai  
\# npm run db:seed:exam

### **6\. 运行应用**

#### **启动后端服务**

cd backend  
npm run dev

后端服务默认运行在 http://localhost:3000。

#### **启动前端开发服务器**

cd frontend  
npm run dev

前端服务默认运行在 http://localhost:5173。

现在，您可以通过浏览器访问 http://localhost:5173 来使用 AI 学习管理系统了。

## **📜 主要脚本命令**

### **后端 (**backend **目录)**

* npm run dev: 启动开发服务器 (使用 tsx 热重载)  
* npm run build: 构建生产版本  
* npm run start: 启动生产版本 (需要先构建)  
* npm run lint: 代码风格检查  
* npm run format: 代码格式化  
* npm run test: 运行测试  
* npm run db:generate: 生成 Prisma Client  
* npm run db:migrate: 应用数据库迁移  
* npm run db:seed: 填充种子数据  
* npm run db:studio: 打开 Prisma Studio (数据库可视化管理)  
* npm run workers:dev: 启动后台任务处理器 (用于AI分析等)

### **前端 (**frontend **目录)**

* npm run dev: 启动 Vite 开发服务器  
* npm run build: 构建生产版本  
* npm run preview: 预览生产构建  
* npm run lint: 代码风格检查  
* npm run type-check: TypeScript 类型检查  
* npm run format: 代码格式化

## **🐳 Docker 构建与运行 (不使用 Docker Compose)**

### **构建后端 Docker 镜像**

cd backend  
docker build \-t ai-lms-backend .

### **运行后端 Docker 容器**

docker run \-p 3000:3000 \\  
  \-e DATABASE\_URL="your\_database\_url" \\  
  \-e REDIS\_URL="your\_redis\_url" \\  
  \-e JWT\_SECRET="your\_jwt\_secret" \\  
  \# ... 其他环境变量  
  ai-lms-backend

### **构建前端 Docker 镜像**

cd frontend  
\# 确保在构建前设置了正确的 VITE\_API\_BASE\_URL 等环境变量  
docker build \-t ai-lms-frontend .

### **运行前端 Docker 容器**

docker run \-p 5173:80 ai-lms-frontend

(前端 Dockerfile 默认使用 nginx 服务静态文件，端口为 80\)

## **☁️ 部署**

详细的部署指南请参考 docs/deployment-guide.md。该指南覆盖了使用 Vercel (前端) 和 Railway (后端) 或 Docker 进行部署的步骤。

### **CI/CD**

项目配置了 GitHub Actions 用于持续集成和持续部署。

* .github/workflows/ci.yml: 执行代码检查、测试和构建。  
* .github/workflows/deploy.yml: 当代码推送到 main 分支时，自动部署到生产环境 (Vercel 和 Railway)。

您需要根据您的实际情况在 GitHub Secrets 中配置以下密钥：

* VERCEL\_TOKEN, VERCEL\_ORG\_ID, VERCEL\_PROJECT\_ID (用于 Vercel 部署)  
* RAILWAY\_TOKEN (用于 Railway 部署)  
* DATABASE\_URL (生产数据库连接字符串，用于迁移)  
* VITE\_API\_URL, VITE\_WS\_URL (生产环境前端指向的后端API和WS地址)  
* SLACK\_WEBHOOK (可选，用于部署通知)

## **🗄️ 数据库迁移与种子数据**

* **迁移**: 使用 Prisma Migrate 管理数据库结构变更。  
  cd backend  
  npx prisma migrate dev \--name your\_migration\_name

* **种子数据**: backend/prisma/seed\*.ts 文件包含用于填充初始数据的脚本。  
  cd backend  
  npm run db:seed

## **⚙️ AI 功能配置**

系统支持 OpenAI API 和本地 Ollama 模型。

### **OpenAI (默认)**

1. 获取您的 OpenAI API 密钥。  
2. 在 backend/.env 文件中设置 OPENAI\_API\_KEY="sk-your-key"。  
3. 可以选择模型，默认为 gpt-3.5-turbo (通过 OPENAI\_MODEL 环境变量配置)。

### **本地 Ollama 模型 (可选)**

1. 安装 Ollama: curl \-fsSL https://ollama.ai/install.sh | sh  
2. 下载您想使用的模型，例如: ollama pull llama2  
3. 确保 Ollama 服务正在运行 (默认 http://localhost:11434)。  
4. 在 backend/.env 中配置:  
   AI\_PROVIDER="ollama"  
   OLLAMA\_BASE\_URL="http://localhost:11434" \# Ollama服务地址  
   OLLAMA\_MODEL="llama2" \# 您下载的模型名称

   如果 Ollama 运行在 Docker 容器中，并且后端服务也运行在 Docker 中，OLLAMA\_BASE\_URL 可能需要设置为 http://host.docker.internal:11434 (Windows/Mac) 或 Docker 网络的内部 IP。

## **🔧 监控与运维**

* **健康检查**:  
  * 后端: /api/health (基本), /api/monitoring/health (详细)  
  * 使用 scripts/health-check.sh 脚本进行定期检查。  
* **日志**:  
  * 后端使用 Pino 进行日志记录，输出到控制台和文件 (backend/logs/)。  
  * 生产环境建议配置集中的日志管理系统 (如 ELK Stack)。  
* **备份**:  
  * 使用 scripts/backup.sh 脚本定期备份 PostgreSQL 数据库和 MinIO/S3 文件。  
  * 配置 Cron Job 自动执行备份。  
* **错误追踪**:  
  * 集成 Sentry。在 backend/.env 和 frontend/.env 中配置 SENTRY\_DSN。

## **🤝 贡献**

欢迎对本项目做出贡献！请遵循以下步骤：

1. Fork 本仓库。  
2. 创建一个新的分支 (git checkout \-b feature/your-feature-name)。  
3. 进行代码修改。  
4. 确保代码风格一致 (npm run lint 和 npm run format 通过)。  
5. 确保所有测试通过 (npm test)。  
6. 提交您的更改 (git commit \-m 'Add some feature')。  
7. 将您的分支推送到远程仓库 (git push origin feature/your-feature-name)。  
8. 创建一个 Pull Request。

请确保您的代码遵循项目已有的编码规范和风格。

## **📄 开源许可**

本项目基于 [MIT License](http://docs.google.com/LICENSE.md) 开源。