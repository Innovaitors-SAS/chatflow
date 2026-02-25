# Build stage - creates static files for production
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build static production files
RUN npm run build

# Production stage - minimal image with built files only
# These files will be extracted and served by the main nginx container
FROM alpine:latest

WORKDIR /build

# Copy built static files
COPY --from=builder /app/dist /build/dist
COPY --from=builder /app/public/index.yaml /build/dist/

# This container is not meant to run - it's just for extracting built files
# The files will be mounted into the main nginx container via docker-compose
CMD ["echo", "Build complete. Extract files with: docker cp <container>:/build/dist /destination"]
