FROM node:22-alpine AS builder

# SAB Lanyard Frontend
WORKDIR /app

# Accept build arguments from compose.yml
# Note: Code automatically appends '/api' - do NOT include it here
ARG VITE_API_URL

# Copy package files and install dependencies
COPY package*.json yarn.lock ./

RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Set Vite environment variables from build arguments
ENV VITE_API_URL=$VITE_API_URL

# Set production build environment variables
ENV NODE_ENV=production

# Build the application with Vite
RUN yarn build

# Production stage - serve static files only
FROM nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built assets from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
	CMD curl -f http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
