FROM node:22-alpine AS builder

# SAB Lanyard Frontend
WORKDIR /app

# Accept build arguments from compose.yml
# Note: Code automatically appends '/api' - do NOT include it here
ARG REACT_APP_API_URL

# Copy package files and install dependencies
COPY package*.json yarn.lock ./

RUN yarn install --frozen-lockfile --production=false

# Copy source code
COPY . .

# Set React environment variables from build arguments
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Set production build environment variables
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV INLINE_RUNTIME_CHUNK=false

# Build the application
RUN yarn build

# Production stage - serve static files only
FROM nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built assets from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Simple nginx config - serve static files with proper caching
RUN echo 'server { \
	listen 80; \
	server_name localhost; \
	root /usr/share/nginx/html; \
	\
	# Ensure correct MIME types are loaded \
	include /etc/nginx/mime.types; \
	default_type application/octet-stream; \
	\
	# No cache for index.html - always serve fresh \
	location = /index.html { \
	add_header Cache-Control "no-cache, no-store, must-revalidate"; \
	add_header Pragma "no-cache"; \
	add_header Expires "0"; \
	try_files $uri =404; \
	} \
	\
	# Assets folder - MUST be before root location to prevent fallback to index.html \
	location /assets/ { \
	expires 1y; \
	add_header Cache-Control "public, immutable"; \
	try_files $uri =404; \
	} \
	\
	# Static folder - serve with cache \
	location /static/ { \
	expires 1y; \
	add_header Cache-Control "public, immutable"; \
	try_files $uri =404; \
	} \
	\
	# Cache manifest and logos \
	location ~* ^/(manifest\\.json|logo.*\\.png|favicon\\.ico|robots\\.txt)$ { \
	expires 7d; \
	add_header Cache-Control "public"; \
	try_files $uri =404; \
	} \
	\
	# Health check endpoint \
	location /health { \
	access_log off; \
	return 200 "healthy\\n"; \
	add_header Content-Type text/plain; \
	} \
	\
	# Default - serve and fallback to index.html for SPA \
	location / { \
	index index.html; \
	try_files $uri $uri/ /index.html; \
	add_header Cache-Control "no-cache"; \
	} \
	}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
	CMD curl -f http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
