FROM node:18-alpine

WORKDIR /app

# Install all dependencies (needed for tsc)
COPY package*.json ./
RUN npm install

# Copy built code and configuration
COPY tsconfig.json ./
COPY src/ ./src/

# Install typescript globally to compile, or use devDependencies
RUN npm install -g typescript
RUN tsc

# Copy proto file to dist
RUN mkdir -p dist/infrastructure/grpc
COPY src/infrastructure/grpc/user.proto dist/infrastructure/grpc/user.proto

# Expose port
EXPOSE 3004

CMD ["node", "dist/index.js"]
