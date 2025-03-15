FROM --platform=linux/amd64 node:20-slim as frontend-builder

# Set work directory for frontend build
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend project files
COPY frontend/ ./

# Set environment variables for the frontend build
ENV NEXT_PUBLIC_API_URL=/api
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Update next.config.ts to enable static export
RUN sed -i 's/const nextConfig: NextConfig = {/const nextConfig: NextConfig = {\n  output: "export",/' next.config.ts

# Build the app
RUN npm run build

# Create a static directory with the built files
RUN mkdir -p /app/frontend/static && \
    if [ -d "out" ]; then \
        cp -r out/* /app/frontend/static/; \
    else \
        # For Next.js 15+, the output might be in .next/server/app
        mkdir -p /app/frontend/static && \
        cp -r .next/* /app/frontend/static/ || true && \
        cp -r public/* /app/frontend/static/ || true; \
    fi && \
    # Create a default index.html if it doesn't exist
    if [ ! -f "/app/frontend/static/index.html" ]; then \
        echo '<!DOCTYPE html><html><head><title>Frontend App</title></head><body><h1>Frontend App</h1><p>This is a placeholder. The actual frontend app should be here.</p><p>Check the build logs to see where the static files were exported.</p></body></html>' > /app/frontend/static/index.html; \
    fi

# Debug: List the contents of directories to see where the files are
RUN echo "Contents of current directory:" && \
    ls -la && \
    echo "Contents of .next directory:" && \
    ls -la .next || true && \
    echo "Contents of out directory:" && \
    ls -la out || true && \
    echo "Contents of static directory:" && \
    ls -la /app/frontend/static || true

# Backend builder stage
FROM python:3.11-slim as backend-builder

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

# Set work directory
WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Final stage
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    PYTHONPATH=/app/backend \
    PORT=80 \
    DJANGO_LOG_LEVEL=DEBUG

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libpq5 \
    nginx \
    procps \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy Python packages from backend builder
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-builder /usr/local/bin/gunicorn /usr/local/bin/gunicorn

# Copy backend files
COPY backend/ /app/backend/

# Copy static frontend files from frontend builder
COPY --from=frontend-builder /app/frontend/static/ /app/frontend/static/

# Create logs directory
RUN mkdir -p /app/logs

# Create staticfiles directory
RUN mkdir -p /app/backend/staticfiles

# Create a simplified entrypoint script directly in the container
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Ensure migrations directory exists\n\
mkdir -p /app/backend/api/migrations\n\
touch /app/backend/api/migrations/__init__.py\n\
\n\
# Show current migration status\n\
cd /app/backend\n\
python manage.py showmigrations\n\
\n\
# Apply any pending migrations\n\
python manage.py migrate --noinput\n\
\n\
# Collect static files\n\
python manage.py collectstatic --noinput\n\
\n\
# Seed products if table is empty\n\
python manage.py seed_products || echo "Seeding failed, continuing anyway"\n\
\n\
# Enable Django debug logging\n\
echo "from django.utils.log import DEFAULT_LOGGING\n\
LOGGING = {\n\
    \"version\": 1,\n\
    \"disable_existing_loggers\": False,\n\
    \"formatters\": {\n\
        \"verbose\": {\n\
            \"format\": \"{levelname} {asctime} {module} {process:d} {thread:d} {message}\",\n\
            \"style\": \"{\",\n\
        },\n\
    },\n\
    \"handlers\": {\n\
        \"console\": {\n\
            \"level\": \"DEBUG\",\n\
            \"class\": \"logging.StreamHandler\",\n\
            \"formatter\": \"verbose\",\n\
        },\n\
        \"file\": {\n\
            \"level\": \"DEBUG\",\n\
            \"class\": \"logging.FileHandler\",\n\
            \"filename\": \"/app/logs/django.log\",\n\
            \"formatter\": \"verbose\",\n\
        },\n\
    },\n\
    \"loggers\": {\n\
        \"django\": {\n\
            \"handlers\": [\"console\", \"file\"],\n\
            \"level\": \"DEBUG\",\n\
            \"propagate\": True,\n\
        },\n\
        \"django.db.backends\": {\n\
            \"handlers\": [\"console\", \"file\"],\n\
            \"level\": \"DEBUG\",\n\
            \"propagate\": False,\n\
        },\n\
    },\n\
}" > /app/backend/core/logging_settings.py\n\
\n\
# Add logging settings import to settings.py\n\
if ! grep -q "from .logging_settings import LOGGING" /app/backend/core/settings.py; then\n\
    echo "\\n# Import logging settings\\nfrom .logging_settings import LOGGING" >> /app/backend/core/settings.py\n\
fi\n\
' > /app/backend/entrypoint.sh

# Make sure the entrypoint script is executable
RUN chmod +x /app/backend/entrypoint.sh

# Create a simple health check endpoint for Divio
RUN mkdir -p /app/health && \
    echo '<!DOCTYPE html><html><head><title>Health Check</title></head><body><h1>OK</h1></body></html>' > /app/health/index.html

# Create Nginx configuration for Divio
RUN echo 'server {\n\
    listen 80 default_server;\n\
    server_name _;\n\
    client_max_body_size 10M;\n\
\n\
    # Health check endpoint\n\
    location /health/ {\n\
        alias /app/health/;\n\
        autoindex on;\n\
    }\n\
\n\
    # Serve static files directly\n\
    location /static/ {\n\
        alias /app/backend/staticfiles/;\n\
        expires 30d;\n\
        autoindex on;\n\
    }\n\
\n\
    # Proxy API requests to Django\n\
    location /api/ {\n\
        proxy_pass http://127.0.0.1:8000;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
        # Add CORS headers\n\
        add_header Access-Control-Allow-Origin *;\n\
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE";\n\
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept";\n\
        add_header Access-Control-Allow-Credentials true;\n\
\n\
        # Handle OPTIONS method for CORS preflight requests\n\
        if ($request_method = OPTIONS) {\n\
            add_header Access-Control-Allow-Origin *;\n\
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE";\n\
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept";\n\
            add_header Access-Control-Allow-Credentials true;\n\
            add_header Content-Length 0;\n\
            add_header Content-Type text/plain;\n\
            return 204;\n\
        }\n\
    }\n\
\n\
    # Proxy admin requests to Django\n\
    location /admin/ {\n\
        proxy_pass http://127.0.0.1:8000;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
    }\n\
\n\
    # Serve frontend static files\n\
    location / {\n\
        root /app/frontend/static;\n\
        index index.html;\n\
        try_files $uri $uri/ /index.html;\n\
        expires 30d;\n\
        autoindex on;\n\
    }\n\
\n\
    # Serve log files\n\
    location /logs/ {\n\
        alias /app/logs/;\n\
        autoindex on;\n\
        auth_basic "Restricted";\n\
        auth_basic_user_file /etc/nginx/.htpasswd;\n\
    }\n\
}' > /etc/nginx/sites-available/default

# Create basic auth for logs access
RUN apt-get update && apt-get install -y apache2-utils && \
    htpasswd -bc /etc/nginx/.htpasswd admin password && \
    rm -rf /var/lib/apt/lists/*

# Ensure Nginx sites-enabled directory exists and create symlink
RUN mkdir -p /etc/nginx/sites-enabled && \
    ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Set proper permissions for Nginx
RUN chown -R www-data:www-data /app/frontend/static /app/backend/staticfiles /app/health /app/logs && \
    chmod -R 755 /app/frontend/static /app/backend/staticfiles /app/health /app/logs

# Create start script with better error handling and logging
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "Starting application..."\n\
\n\
# Create a simple index.html for health checks\n\
mkdir -p /app/health\n\
echo "<!DOCTYPE html><html><head><title>Health Check</title></head><body><h1>OK</h1></body></html>" > /app/health/index.html\n\
chmod 644 /app/health/index.html\n\
\n\
# Run backend entrypoint script\n\
echo "Running backend entrypoint..."\n\
cd /app/backend\n\
bash ./entrypoint.sh\n\
\n\
# Start backend with gunicorn with detailed logging\n\
echo "Starting Django backend..."\n\
cd /app/backend\n\
gunicorn core.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 2 \
  --threads 2 \
  --worker-class=gthread \
  --log-level=debug \
  --log-file=/app/logs/gunicorn.log \
  --access-logfile=/app/logs/access.log \
  --error-logfile=/app/logs/error.log \
  --capture-output \
  --daemon\n\
\n\
# Create a simple web server for health checks\n\
echo "Creating a simple web server for Divio health checks..."\n\
cd /app/health\n\
python -m http.server 8080 &\n\
\n\
# Check if frontend static files exist\n\
echo "Checking frontend static files..."\n\
ls -la /app/frontend/static/\n\
\n\
# Check Nginx configuration\n\
echo "Testing Nginx configuration..."\n\
nginx -t\n\
\n\
# Start Nginx\n\
echo "Starting Nginx..."\n\
nginx -g "daemon off;"\n\
' > /app/start.sh && chmod +x /app/start.sh

# Expose ports
EXPOSE 80 8080

# Start services
CMD ["/app/start.sh"] 