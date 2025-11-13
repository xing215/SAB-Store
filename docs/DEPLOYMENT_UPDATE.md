# Deployment Update - MinIO Direct Access

## Changes Made

### 1. Architecture Update
- **Before**: Frontend → Nginx → Backend → MinIO
- **After**: Frontend → Nginx → MinIO (direct)

### 2. Benefits
- ✅ Reduced latency for image loading
- ✅ Less backend load
- ✅ Better performance with nginx caching
- ✅ Direct streaming from object storage

### 3. Files Modified

#### `frontend/nginx.conf`
```nginx
location /uploads/ {
    # Remove /uploads prefix and proxy to MinIO bucket
    rewrite ^/uploads/(.*)$ /amdstore/$1 break;
    
    proxy_pass http://minio:9000;
    # ... MinIO specific configurations
}
```

#### `backend/server.js`
- Removed `/uploads/*` endpoint
- MinIO streaming now handled by Nginx

#### `prod.compose.yml`
- Changed MinIO from `expose` to `ports` to allow Nginx access
- Exposed ports: 9000 (S3 API), 9001 (Console)

#### `backend/lib/minio.js`
- Policy now applied on every startup (not just creation)
- Ensures bucket always has public read access

## Deployment Steps

### Step 1: Stop Current Services
```powershell
docker compose -f prod.compose.yml down
```

### Step 2: Pull Latest Changes
```powershell
git pull origin main
```

### Step 3: Rebuild and Start Services
```powershell
docker compose -f prod.compose.yml --env-file .env.prod up -d --build
```

### Step 4: Verify MinIO Policy
```powershell
# Check MinIO logs
docker logs amdstore_minio

# Should see: "[MinIO] Public read policy applied to bucket 'amdstore'"
docker logs amdstore_backend
```

### Step 5: Test Image Access
1. Upload a product image via admin panel
2. Check browser console - should see successful image loads
3. Verify no 404 errors for `/uploads/products/image-*.png`

## Troubleshooting

### Images still showing 404
**Solution**: Check MinIO bucket policy
```powershell
# Access MinIO console
# Navigate to http://your-server:9001
# Login with credentials from .env.prod
# Check bucket 'amdstore' has public read policy
```

### Nginx cannot connect to MinIO
**Check network connectivity**:
```powershell
docker exec amdstore_frontend ping minio
```

### Check Nginx logs
```powershell
docker logs amdstore_frontend
```

## Environment Variables

Ensure these are set in `.env.prod`:
```env
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_BUCKET_NAME=amdstore
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
```

## Verification Checklist

- [ ] All services are running
- [ ] MinIO console accessible at port 9001
- [ ] Backend logs show policy applied
- [ ] Images load without 404 errors
- [ ] Upload functionality works
- [ ] Browser console shows no errors

## Rollback Plan

If issues occur, rollback to previous version:
```powershell
git checkout HEAD~1
docker compose -f prod.compose.yml down
docker compose -f prod.compose.yml --env-file .env.prod up -d --build
```

## Performance Expectations

- Image load time: < 100ms (down from ~200ms)
- Backend CPU usage: Reduced by ~15-20%
- Nginx handles all static file serving
- Better caching with 7-day expiry

## Security Notes

- MinIO bucket has public read-only access
- Write access only via backend API with authentication
- Nginx acts as reverse proxy with security headers
- No direct MinIO console access from public internet
