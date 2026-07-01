# Stage 1: Build the React Application
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install || (sleep 5 && npm install)

# Copy source code and build
COPY . .
ARG VITE_STRIPE_PUBLIC_KEY
ENV VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets to the appropriate directory
COPY --from=builder /app/dist /var/www/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]