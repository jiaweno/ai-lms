#!/bin/bash

echo "🚀 Setting up AI Learning Management System environment..."

# Create environment files from examples
echo "📄 Creating environment files..."

# Root environment
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env from .env.example"
else
    echo "ℹ️ .env already exists"
fi

# Frontend environment
if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env from frontend/.env.example"
else
    echo "ℹ️ frontend/.env already exists"
fi

# Backend environment
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env from backend/.env.example"
else
    echo "ℹ️ backend/.env already exists"
fi

# Generate JWT secret
echo "🔐 Generating JWT secret..."
JWT_SECRET=$(openssl rand -base64 32)
sed -i.bak "s/your-super-secret-jwt-key-change-in-production-minimum-32-characters/$JWT_SECRET/g" .env backend/.env
rm -f .env.bak backend/.env.bak

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backend/logs
mkdir -p backend/uploads
mkdir -p frontend/public/uploads

echo "✅ Environment setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Review and update the environment variables in .env files"
echo "2. Add your OpenAI API key to enable AI features"
echo "3. Configure database credentials if using external services"
echo "4. Run 'docker-compose up -d' to start the local development environment"
echo "5. Run 'npm install' in both 'frontend/' and 'backend/' directories"
echo "6. Run 'npm run db:migrate' in 'backend/' to apply Prisma migrations"
echo "7. Run 'npm run db:seed' in 'backend/' to populate initial data"
