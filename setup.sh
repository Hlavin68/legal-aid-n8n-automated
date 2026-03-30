#!/bin/bash

# MERN Setup script for Kenyan Legal AI Assistant

echo "🚀 Setting up Kenyan Legal AI Assistant (MERN Stack)..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Setup server
echo ""
echo "📦 Setting up backend (Express)..."
cd server

if [ ! -f .env ]; then
    echo "Creating server/.env from .env.example..."
    cp .env.example .env
fi

npm install
echo "✅ Backend dependencies installed"

# Setup client
echo ""
echo "📦 Setting up frontend (React)..."
cd ../client

if [ ! -f .env ]; then
    echo "Creating client/.env from .env.example..."
    cp .env.example .env
fi

npm install
echo "✅ Frontend dependencies installed"

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Make sure n8n is running: n8n start"
echo "  2. Start the application: npm start"
echo "  3. Open http://localhost:3000 in your browser"
echo ""
echo "📚 For more info, see README.md"
