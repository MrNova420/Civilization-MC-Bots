# BetterBender 2.0 - Production Dockerfile
FROM node:18-alpine

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create data directories
RUN mkdir -p data/logs data/civilization data/tasks

# Expose dashboard port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })" || exit 1

# Run as non-root user
RUN addgroup -g 1001 botuser && \
    adduser -D -u 1001 -G botuser botuser && \
    chown -R botuser:botuser /app

USER botuser

# Start application
CMD ["node", "launcher.js"]
