#!/bin/bash

# Mykonos PostgreSQL Docker Setup Script

echo "🚀 Starting Mykonos PostgreSQL Docker Setup..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose >/dev/null 2>&1; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

echo "✅ docker-compose is available"

# Start the containers
echo "🐳 Starting PostgreSQL and Adminer containers..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout=60
counter=0

while ! docker exec mykonos-postgres pg_isready -U mykonos_user -d mykonos >/dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        echo "❌ PostgreSQL failed to start within ${timeout} seconds"
        exit 1
    fi
    counter=$((counter + 1))
    sleep 1
done

echo "✅ PostgreSQL is ready!"

# Show connection information
echo ""
echo "🎉 Setup complete!"
echo ""
echo "📊 Database Connection Info:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: mykonos"
echo "  Username: mykonos_user"
echo "  Password: mykonos_password"
echo ""
echo "🌐 Adminer (Database GUI) is available at:"
echo "  URL: http://localhost:8080"
echo "  System: PostgreSQL"
echo "  Server: postgres"
echo "  Username: mykonos_user"
echo "  Password: mykonos_password"
echo "  Database: mykonos"
echo ""
echo "🔧 To stop the containers: docker-compose down"
echo "🗑️  To remove all data: docker-compose down -v"
