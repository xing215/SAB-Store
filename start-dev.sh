#!/bin/bash

# Script to start the Mini Preorder development environment

echo "🚀 Starting Mini Preorder Development Environment"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose could not be found. Please install Docker Compose."
    exit 1
fi

# Create environment file for backend if it doesn't exist
if [ ! -f "./backend/.env" ]; then
    echo "📝 Creating backend environment file..."
    cp ./backend/.env.example ./backend/.env
    echo "✅ Created backend/.env file. Please update it with your email configuration."
fi

# Build and start services
echo "🐳 Building and starting Docker containers..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if MongoDB is ready
echo "🍃 Checking MongoDB connection..."
for i in {1..30}; do
    if docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        echo "✅ MongoDB is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ MongoDB failed to start after 30 attempts"
        exit 1
    fi
    sleep 2
done

# Check if backend is ready
echo "🔧 Checking backend API..."
for i in {1..30}; do
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        echo "✅ Backend API is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend API failed to start after 30 attempts"
        exit 1
    fi
    sleep 2
done

# Check if frontend is ready
echo "⚛️ Checking frontend..."
for i in {1..60}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend is ready"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "❌ Frontend failed to start after 60 attempts"
        exit 1
    fi
    sleep 2
done

echo "🎉 All services are ready!"
echo ""
echo "📱 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   Admin Dashboard: http://localhost:3000/dashboard"
echo ""
echo "🔑 Admin Login:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📊 View logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
