FROM nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Remove default nginx configurations
RUN rm /etc/nginx/nginx.conf && \
	rm -f /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create cache directory
RUN mkdir -p /var/cache/nginx && \
	chown -R nginx:nginx /var/cache/nginx

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
	CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
