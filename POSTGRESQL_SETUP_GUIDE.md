# 🐘 PostgreSQL Setup Guide for Mykonos-os

This guide explains how to use PostgreSQL with Docker in your Mykonos application.

## 📋 Quick Answer to Your Questions

### 1. Adminer Web GUI Credentials

**🌐 Access URL:** http://localhost:8080

**🔑 Login Credentials:**

- **System:** PostgreSQL
- **Server:** `postgres`
- **Username:** `mykonos_user`
- **Password:** `mykonos_password`
- **Database:** `mykonos`

### 2. How to Update Python Database Connection

✅ **Already updated!** Your `database.py` file now supports both PostgreSQL and SQLite.

## 🚀 How to Get Started

### Step 1: Start PostgreSQL with Docker

```bash
# Start the containers
docker-compose up -d

# Check if containers are running
docker ps
```

### Step 2: Test Database Connection

```bash
# Navigate to backend directory
cd src/backend

# Run the database test script
python test_database_connection.py
```

### Step 3: Update Your Application Code

Your `Database` class now automatically uses PostgreSQL by default. To initialize:

```python
# Automatic (uses .env configuration)
db = Database()

# Force PostgreSQL
db = Database(use_postgres=True)

# Force SQLite (legacy)
db = Database(use_postgres=False)
```

## 🔧 Configuration

### Environment Variables (.env file)

```env
USE_POSTGRES=true
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mykonos
DB_USER=mykonos_user
DB_PASSWORD=mykonos_password
```

### Docker Configuration (docker-compose.yml)

- **PostgreSQL Container:** `mykonos-postgres`
- **Adminer Container:** `mykonos-adminer`
- **Data Volume:** `postgres_data`

## 🔄 Switching Between Databases

### To use PostgreSQL (recommended):

1. Set `USE_POSTGRES=true` in `.env`
2. Make sure Docker containers are running
3. Your app will automatically use PostgreSQL

### To use SQLite (legacy):

1. Set `USE_POSTGRES=false` in `.env`
2. Your app will use the old SQLite database

## 📊 Database Schema

The PostgreSQL database is automatically initialized with:

- All your existing tables
- Sample data from your SQLite dump
- Proper foreign key constraints
- Optimized data types for PostgreSQL

## 🛠️ Useful Commands

### Docker Commands

```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs postgres
docker-compose logs adminer

# Remove all data (⚠️ DESTRUCTIVE)
docker-compose down -v
```

### Database Commands

```bash
# Connect to PostgreSQL directly
docker exec -it mykonos-postgres psql -U mykonos_user -d mykonos

# Backup database
docker exec mykonos-postgres pg_dump -U mykonos_user mykonos > backup.sql

# Restore database
docker exec -i mykonos-postgres psql -U mykonos_user mykonos < backup.sql
```

## 🔍 Troubleshooting

### Connection Issues

1. **Check if containers are running:** `docker ps`
2. **Check container logs:** `docker-compose logs postgres`
3. **Test connection:** `python test_database_connection.py`

### Port Conflicts

If port 5432 or 8080 are already in use:

1. Edit `docker-compose.yml`
2. Change the ports (e.g., `"5433:5432"` and `"8081:8080"`)
3. Update your `.env` file accordingly

### Data Issues

If you need to reset the database:

```bash
docker-compose down -v  # ⚠️ This deletes all data
docker-compose up -d    # Recreates with fresh schema
```

## 🎯 Next Steps

1. ✅ Start Docker containers: `docker-compose up -d`
2. ✅ Test connection: `python test_database_connection.py`
3. ✅ Access Adminer: http://localhost:8080
4. ✅ Update your application to use the new Database class
5. 🔄 Migrate any remaining SQLite-specific code

Your application is now ready to use PostgreSQL! 🎉
