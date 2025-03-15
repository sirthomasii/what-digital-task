# Development image
FROM --platform=linux/amd64 node:20-slim

# Set work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (using npm install instead of npm ci for development)
RUN npm install

# Copy project files
COPY . .

# Expose port
EXPOSE 3000

# Start the development server
CMD ["npm", "run", "dev"]

# Build stage
FROM --platform=linux/amd64 node:20-slim as build

# Set work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with npm ci for deterministic installs
RUN npm ci

# Copy project files
COPY . .

# Build the app with production optimization
ENV NODE_ENV=production
RUN npm run build

# Production stage
FROM --platform=linux/amd64 node:20-slim

WORKDIR /app

# Copy only necessary files from build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/next.config.ts ./
COPY --from=build /app/tsconfig.json ./

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Start the production server
CMD ["npm", "start"] 