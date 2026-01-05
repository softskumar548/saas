# Stage 1: Build the Angular application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json and lock file
COPY package*.json ./

# Install dependencies (ignoring scripts to avoid potential issues with prepare scripts)
RUN npm ci --ignore-scripts

# Copy the rest of the application code
COPY . .

# Build the specific application (web-client) for production
# npx nx build web-client --prod is the standard way, but we use the script or direct command
RUN npx nx build web-client --configuration=production

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the build output from the previous stage
# The path depends on the outputPath in project.json: "dist/apps/web-client"
COPY --from=build /app/dist/apps/web-client /usr/share/nginx/html

# Copy custom Nginx configuration if you have one (optional, using default for now)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
