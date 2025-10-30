# Nginx Service Documentation

## Overview
Nginx service được thêm vào để làm reverse proxy chính, giúp:
- Phân phối static files (frontend React app)
- Proxy API requests tới backend NodeJS
- Cache static assets và responses
- Giảm tải cho backend server
- Thêm security headers và rate limiting

## Architecture

```
Client (Browser)
      ↓
  [Nginx :80]
      ├─→ /api/*        → backend:5000 (API requests)
      ├─→ /api/upload   → backend:5000 (Upload với timeout dài)
      ├─→ /uploads/*    → backend:5000 (Static images, cached 7 days)
      └─→ /*            → frontend:80 (React app, cached 1 hour)
```

## Configuration Files

### nginx/Dockerfile
- Base image: `nginx:alpine` (nhẹ, bảo mật)
- Copy custom nginx.conf
- Healthcheck endpoint: `/health`
- Install curl cho healthcheck

### nginx/nginx.conf
Main configuration với các sections:

#### Performance Settings
- `worker_processes auto`: Tự động theo số CPU cores
- `worker_connections 1024`: Tối đa 1024 connections/worker
- `keepalive_timeout 65`: Giữ connection 65s
- `sendfile on`, `tcp_nopush on`, `tcp_nodelay on`: Tối ưu network

#### Gzip Compression
- Level 6 compression
- Áp dụng cho: text, css, js, json, xml, svg, fonts
- Tiết kiệm bandwidth ~70%

#### Caching Strategy
- **Static cache zone**: 10MB, inactive 7 days
- **Frontend cache**: 1 hour
- **Upload images cache**: 7 days, immutable
- **API**: No cache (dynamic content)

#### Rate Limiting
- **API requests**: 10 req/s, burst 20
- **General requests**: 30 req/s, burst 50
- **Upload**: 10 req/s, burst 5

#### Security Headers
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: no-referrer-when-downgrade`

## Endpoints

### /api/*
- Proxy to: `backend:5000`
- Rate limit: 10 req/s
- No caching
- Timeouts: 60s

### /api/upload
- Special handling for large files
- Max body size: 50MB
- Extended timeout: 300s
- Request buffering: off

### /uploads/*
- Proxy to: `backend:5000`
- Cached: 7 days
- Cache on 404: 1 minute
- Cache-Control: public, immutable

### / (root)
- Proxy to: `frontend:80`
- Cached: 1 hour
- Serves React app

### /health
- Direct nginx response
- Returns: `healthy`
- No logging
- Used for Docker healthcheck

### /nginx_status
- Nginx stub_status module
- Access: localhost + Docker network only
- No logging
- For monitoring

## Docker Compose Integration

```yaml
nginx:
  build: ./nginx
  ports:
    - "80:80"  # Exposed externally
  depends_on:
    - backend
    - frontend
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost/health"]
```

### Service Dependencies
1. **mongodb** → Start first
2. **minio** → Start first
3. **backend** → After DB & MinIO
4. **frontend** → After backend
5. **nginx** → After all (entry point)

## Performance Benefits

### Before (Direct Access)
- Frontend: Port 3000 (dev server hoặc nginx trong container)
- Backend: Port 5000 (NodeJS express)
- Client kết nối trực tiếp tới 2 services

### After (Nginx Proxy)
- **Single entry point**: Port 80 only
- **Static file serving**: Nginx phục vụ (nhanh hơn NodeJS ~2-3x)
- **Response caching**: Giảm load DB và backend processing
- **Connection pooling**: Keepalive connections tới backend
- **Gzip compression**: Giảm bandwidth ~70%

## Monitoring

### Access Logs
```bash
docker compose exec nginx tail -f /var/log/nginx/access.log
```

### Error Logs
```bash
docker compose exec nginx tail -f /var/log/nginx/error.log
```

### Cache Status
Check `X-Cache-Status` header:
- `HIT`: Served from cache
- `MISS`: Not in cache, fetched from backend
- `BYPASS`: Cache bypassed
- `EXPIRED`: Cache expired, revalidating

### Nginx Status
```bash
curl http://localhost/nginx_status
```

## Production Optimization

### Enable SSL (Production)
Update nginx.conf:
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    # ... rest of config
}
```

### Increase Cache Size
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=STATIC:100m
                 inactive=7d max_size=1g use_temp_path=off;
```

### Add More Upstream Servers
```nginx
upstream backend_upstream {
    server backend1:5000;
    server backend2:5000;
    keepalive 32;
}
```

## Troubleshooting

### Nginx không start
```bash
# Check logs
docker compose logs nginx

# Test config syntax
docker compose exec nginx nginx -t

# Reload config
docker compose exec nginx nginx -s reload
```

### 502 Bad Gateway
- Backend chưa ready: Đợi backend healthcheck pass
- Connection refused: Check backend service running
- Timeout: Increase proxy timeouts

### Cache không work
- Check `X-Cache-Status` header
- Verify cache directory exists: `/var/cache/nginx`
- Check cache zone size not full

### High memory usage
- Reduce cache size in nginx.conf
- Reduce worker_connections
- Monitor with `docker stats`

## References
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Nginx Reverse Proxy Guide](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Nginx Caching Guide](https://docs.nginx.com/nginx/admin-guide/content-cache/content-caching/)
