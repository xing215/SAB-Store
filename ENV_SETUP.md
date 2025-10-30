# Environment Configuration Guide

## Setup Instructions

1. **Copy the example environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Update `.env` with your actual values**:
   - Change default passwords and secrets
   - Update API URLs for your deployment environment
   - Configure bank payment information
   - Set your AppScript URL

## Environment Variables

### MongoDB Configuration
- `MONGO_INITDB_ROOT_USERNAME`: MongoDB root username (default: `admin`)
- `MONGO_INITDB_ROOT_PASSWORD`: MongoDB root password (default: `password123`)
- `MONGO_INITDB_DATABASE`: Initial database name (default: `minipreorder`)
- `MONGODB_PORT`: MongoDB port mapping (default: `27017`)

### Backend Configuration
- `NODE_ENV`: Node environment (default: `production`)
- `BACKEND_PORT`: Backend API port (default: `5000`)
- `BASE_URL`: Backend base URL (default: `http://localhost:5000`)
- `MONGODB_URI`: Full MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens [CHANGE THIS]
- `ADMIN_EMAIL`: Admin user email
- `ADMIN_USERNAME`: Admin username
- `ADMIN_PASSWORD`: Admin password [CHANGE THIS]
- `APPSCRIPT_URL`: Google Apps Script webhook URL
- `CORS_ORIGIN`: Allowed CORS origin (default: `http://localhost:3000`)

### Frontend Configuration
- `FRONTEND_PORT`: Frontend port mapping (default: `3000`)
- `REACT_APP_API_URL`: Backend API URL (default: `http://localhost:5000`)
- `REACT_APP_BANK_NAME_ID`: Bank identifier for payment QR code
- `REACT_APP_ACCOUNT_NO`: Bank account number for payments

### System Configuration
- `TZ`: Timezone (default: `Asia/Ho_Chi_Minh`)

## Security Notes

[CRITICAL] Before deploying to production:
1. Change `JWT_SECRET` to a strong random string
2. Change `ADMIN_PASSWORD` to a secure password
3. Update `MONGO_INITDB_ROOT_PASSWORD` to a strong password
4. Never commit `.env` file to version control
5. Use different credentials for production and development

## Docker Compose Usage

The `compose.yml` file automatically reads variables from `.env`:

```bash
# Start all services
docker compose up -d

# Rebuild with new environment variables
docker compose up -d --build

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

## Dockerfile Changes

### Backend Dockerfile
- Removed all ARG declarations
- Environment variables are now injected at runtime via compose.yml
- Cleaner build process without redundant build arguments

### Frontend Dockerfile
- Kept only REACT_APP_* ARGs (required for build-time injection)
- React environment variables must be available during build
- Production optimizations remain unchanged
