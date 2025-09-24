# Mykonos OS Deployment Guide

Este documento explica cómo desplegar y mantener Mykonos OS en producción.

## 🚀 Configuración Inicial

### 1. Preparar el Entorno de Producción

```bash
# Clonar el repositorio
git clone https://github.com/breightend/Mykonos-os.git
cd Mykonos-os

# Configurar el entorno de producción
python setup.py production
```

### 2. Configurar Variables de Entorno

```bash
# Copiar y editar el archivo de configuración
cp .env.prod.example .env.prod

# Generar claves seguras
python setup.py generate-keys
```

Edita `.env.prod` con tus configuraciones:

```env
# Environment
ENVIRONMENT=production

# Database
DB_HOST=tu_servidor_postgres
DB_PORT=5432
DB_NAME=mykonos_prod
DB_USER=mykonos_user
DB_PASSWORD=TU_PASSWORD_SEGURO

# Security (usar las claves generadas)
SECRET_KEY=tu_clave_secreta_generada
JWT_SECRET_KEY=tu_jwt_secret_generado

# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# CORS (ajustar a tu dominio)
CORS_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com
```

## 🐳 Deployment con Docker

### Primera Vez

```bash
# Hacer el deploy inicial
./deploy.sh production v1.0.0
```

### Actualizaciones

```bash
# 1. Hacer backup de la base de datos (automático en el script)
# 2. Subir cambios a git
git add .
git commit -m "Nueva versión con correcciones"
git push

# 3. Hacer el deploy
./deploy.sh production v1.0.1
```

## 🗄️ Gestión de Base de Datos

### Migraciones

```bash
# Crear una nueva migración
python migrate.py create --name "add_new_field_to_users"

# Aplicar migraciones pendientes
python migrate.py migrate

# Ver estado de las migraciones
python migrate.py status
```

### Backups

```bash
# Crear backup manual
docker exec mykonos-postgres pg_dump -U mykonos_user mykonos_prod > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker exec -i mykonos-postgres psql -U mykonos_user mykonos_prod < backup_20241024.sql
```

## 📊 Monitoreo

### Health Checks

- **Aplicación**: `http://tu-servidor/api/health`
- **Base de datos**: `http://tu-servidor/api/health/ready`
- **Servidor vivo**: `http://tu-servidor/api/health/live`

### Logs

```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.prod.yml logs -f

# Ver logs específicos
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs postgres
```

### Métricas

Los logs se guardan en:

- `/app/logs/mykonos.log` - Logs generales
- `/app/logs/errors.log` - Solo errores
- Rotación automática cada 10MB

## 🔧 Solución de Problemas

### La aplicación no responde

```bash
# Verificar estado de los contenedores
docker-compose -f docker-compose.prod.yml ps

# Reiniciar servicios
docker-compose -f docker-compose.prod.yml restart

# Ver logs para diagnosticar
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Problemas de base de datos

```bash
# Conectar a la base de datos directamente
docker exec -it mykonos-postgres psql -U mykonos_user mykonos_prod

# Verificar conectividad
curl -f http://localhost:8080/api/health
```

### Rollback

Si algo sale mal durante el deployment:

```bash
# El script preguntará automáticamente si quieres hacer rollback
# O puedes hacerlo manualmente:

# 1. Detener servicios actuales
docker-compose -f docker-compose.prod.yml down

# 2. Restaurar backup de base de datos
docker exec -i mykonos-postgres psql -U mykonos_user mykonos_prod < backups/ultimo_backup.sql

# 3. Volver a la versión anterior
git checkout v1.0.0  # o la versión anterior
./deploy.sh production v1.0.0
```

## 🔒 Seguridad

### SSL/HTTPS

1. Obtener certificados SSL (Let's Encrypt recomendado):

```bash
# Usando certbot
sudo certbot certonly --standalone -d tu-dominio.com
```

2. Configurar nginx (ver `nginx/nginx.conf`)

3. Actualizar variables de entorno:

```env
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

### Firewalls

Asegúrate de que solo los puertos necesarios estén abiertos:

```bash
# Puertos necesarios:
# 80 - HTTP (redirige a HTTPS)
# 443 - HTTPS
# 22 - SSH (para administración)

sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

## 📝 Mantenimiento Rutinario

### Diario

- Verificar health checks
- Revisar logs de errores

### Semanal

- Backup completo de base de datos
- Limpiar logs antiguos
- Actualizar dependencias de seguridad

### Mensual

- Revisar métricas de rendimiento
- Actualizar sistema operativo
- Rotar logs

## 🚨 Contacto de Emergencia

En caso de problemas críticos:

1. Verificar health checks
2. Revisar logs
3. Si es necesario, hacer rollback
4. Contactar al equipo de desarrollo

## 📚 Comandos Útiles

```bash
# Ver estado completo del sistema
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs --tail=50

# Limpiar recursos no utilizados
docker system prune -f

# Actualizar solo el backend
docker-compose -f docker-compose.prod.yml up -d --no-deps backend

# Acceder al contenedor backend
docker-compose -f docker-compose.prod.yml exec backend bash

# Ejecutar comando en la base de datos
docker-compose -f docker-compose.prod.yml exec postgres psql -U mykonos_user mykonos_prod
```
