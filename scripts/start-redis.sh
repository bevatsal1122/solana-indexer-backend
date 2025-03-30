#!/bin/bash

# Script to start Redis using Docker for testing BullMQ
# This script checks if a Redis container is already running and starts one if not

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Redis container is already running
CONTAINER_NAME="solana-indexer-redis"
REDIS_PORT=6379

if docker ps | grep -q "$CONTAINER_NAME"; then
    echo "✅ Redis is already running in container: $CONTAINER_NAME"
    echo "   To stop it: docker stop $CONTAINER_NAME"
    echo "   To remove it: docker rm $CONTAINER_NAME"
else
    echo "🚀 Starting Redis container..."
    docker run --name $CONTAINER_NAME -p $REDIS_PORT:6379 -d redis
    
    if [ $? -eq 0 ]; then
        echo "✅ Redis started successfully in container: $CONTAINER_NAME"
        echo "   Redis is available at localhost:$REDIS_PORT"
        echo "   To stop it: docker stop $CONTAINER_NAME"
        echo "   To remove it: docker rm $CONTAINER_NAME"
    else
        echo "❌ Failed to start Redis container"
        exit 1
    fi
fi

# Show Redis container status
echo ""
echo "Redis container status:"
docker ps -f name=$CONTAINER_NAME

# Try to ping Redis
echo ""
echo "Testing Redis connection..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping | grep -q "PONG"; then
        echo "✅ Redis is responding to pings"
    else
        echo "❌ Redis is not responding to pings"
    fi
else
    echo "ℹ️ redis-cli not found. Install Redis locally to test connection."
    echo "  You can still use Redis through Docker."
fi

echo ""
echo "Environment variables for your .env file:"
echo "REDIS_HOST=localhost"
echo "REDIS_PORT=$REDIS_PORT"
echo "REDIS_PASSWORD="
echo ""
echo "Redis is ready for BullMQ to use!" 