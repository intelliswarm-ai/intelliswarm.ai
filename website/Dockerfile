# Multi-stage build for Angular
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build --prod

# Production stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/dist/intelliswarm-website /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 4200

CMD ["nginx", "-g", "daemon off;"]