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

### Nginx Configuration
- `NGINX_PORT`: Nginx reverse proxy external port (default: `80`)

### Backend Configuration
- `NODE_ENV`: Node environment (default: `production`)
- `BACKEND_PORT`: Backend API internal port (default: `5000`, not exposed externally)
- `BASE_URL`: Backend base URL (default: `http://localhost` - Nginx handles routing)
- `MONGODB_URI`: Full MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens [CHANGE THIS]
- `ADMIN_EMAIL`: Admin user email
- `ADMIN_USERNAME`: Admin username
- `ADMIN_PASSWORD`: Admin password [CHANGE THIS]
- `APPSCRIPT_URL`: Google Apps Script webhook URL
- `CORS_ORIGIN`: Allowed CORS origin (default: `http://localhost` - matches Nginx URL)

### MinIO Object Storage Configuration
- `MINIO_ROOT_USER`: MinIO root username (default: `minioadmin`)
- `MINIO_ROOT_PASSWORD`: MinIO root password (default: `minioadmin123`) [CHANGE THIS]
- `MINIO_ENDPOINT`: MinIO service endpoint (default: `minio` for Docker, `localhost` for local dev)
- `MINIO_PORT`: MinIO API port (default: `9000`)
- `MINIO_BUCKET_NAME`: MinIO bucket name for file storage (default: `sablanyard`)
- `MINIO_USE_SSL`: Enable SSL for MinIO connection (default: `false`)

### Frontend Configuration
- `FRONTEND_PORT`: Frontend internal port (default: `80`, not exposed externally)
- `REACT_APP_API_URL`: Backend API URL (default: `http://localhost/api` - routes through Nginx)

### System Configuration
- `TZ`: Timezone (default: `Asia/Ho_Chi_Minh`)

### Payment Settings
Payment settings (Bank Name, Account Number, Prefix Message) are now managed via the Admin Settings page and stored in the database. Initial values can be set via backend environment variables:
- `BANK_NAME_ID`: Initial bank identifier (e.g., `MB`, `VCB`)
- `BANK_ACCOUNT_ID`: Initial bank account number
- `PREFIX_MESSAGE`: Initial payment prefix message (default: `SAB`)

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
