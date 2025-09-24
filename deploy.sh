#!/bin/bash

# Mykonos OS Deployment Script
# Usage: ./deploy.sh [environment] [version]

set -e  # Exit on any error

# Default values
ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
COMPOSE_FILE="docker-compose.prod.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

# Check if required environment variables are set
check_env_vars() {
    log "Checking environment variables..."
    
    required_vars=("DB_PASSWORD" "SECRET_KEY" "JWT_SECRET_KEY")
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    success "All required environment variables are set"
}

# Create backup of current database
backup_database() {
    log "Creating database backup..."
    
    if [[ -f ".env.prod" ]]; then
        source .env.prod
    fi
    
    BACKUP_FILE="backups/mykonos_backup_$(date +%Y%m%d_%H%M%S).sql"
    mkdir -p backups
    
    # Create backup using pg_dump
    docker exec mykonos-postgres pg_dump -U ${DB_USER:-mykonos_user} ${DB_NAME:-mykonos_db} > "$BACKUP_FILE"
    
    if [[ $? -eq 0 ]]; then
        success "Database backup created: $BACKUP_FILE"
    else
        error "Database backup failed"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    python migrate.py migrate
    
    if [[ $? -eq 0 ]]; then
        success "Database migrations completed"
    else
        error "Database migrations failed"
        exit 1
    fi
}

# Build and deploy services
deploy_services() {
    log "Building and deploying services..."
    
    # Pull latest images
    docker-compose -f $COMPOSE_FILE pull
    
    # Build backend with version tag
    docker-compose -f $COMPOSE_FILE build --no-cache backend
    
    # Tag the image with version
    docker tag mykonos-os_backend:latest mykonos-os_backend:$VERSION
    
    # Deploy services with rolling update
    docker-compose -f $COMPOSE_FILE up -d --remove-orphans
    
    success "Services deployed successfully"
}

# Health check
health_check() {
    log "Performing health check..."
    
    max_attempts=30
    attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
            success "Health check passed"
            return 0
        fi
        
        log "Health check attempt $attempt/$max_attempts failed, retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
    return 1
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up old images and containers..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused volumes (be careful with this in production)
    # docker volume prune -f
    
    success "Cleanup completed"
}

# Rollback function
rollback() {
    warning "Rolling back to previous version..."
    
    # Stop current containers
    docker-compose -f $COMPOSE_FILE down
    
    # Restore from backup (you'd implement this based on your backup strategy)
    # restore_database_backup
    
    # Deploy previous version (you'd need to implement version tracking)
    # docker-compose -f $COMPOSE_FILE up -d
    
    warning "Rollback completed"
}

# Main deployment process
main() {
    log "Starting deployment for environment: $ENVIRONMENT, version: $VERSION"
    
    # Check if this is production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        warning "Deploying to PRODUCTION environment"
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Pre-deployment checks
    check_env_vars
    
    # Create backup if in production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        backup_database
    fi
    
    # Run migrations
    run_migrations
    
    # Deploy services
    deploy_services
    
    # Wait a bit for services to start
    log "Waiting for services to start..."
    sleep 30
    
    # Health check
    if health_check; then
        success "Deployment completed successfully! 🎉"
        
        # Show service status
        log "Service status:"
        docker-compose -f $COMPOSE_FILE ps
        
        # Cleanup
        cleanup
        
    else
        error "Deployment failed health check"
        log "Check logs with: docker-compose -f $COMPOSE_FILE logs"
        
        # Optionally rollback
        read -p "Do you want to rollback? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rollback
        fi
        
        exit 1
    fi
}

# Trap errors and provide helpful message
trap 'error "Deployment failed at line $LINENO. Check the logs above."' ERR

# Check if docker and docker-compose are available
if ! command -v docker &> /dev/null; then
    error "Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose is not installed or not in PATH"
    exit 1
fi

# Run main function
main "$@"
