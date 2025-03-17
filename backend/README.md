# What Digital Task - Backend

This is the backend service for the What Digital Task project, built with Django and Django REST Framework.

## Development with Docker

### Prerequisites
- Docker
- Docker Compose

### Quick Start
1. Clone the repository
2. Start the development environment:
   ```bash
   docker compose -f docker-compose.dev.yml up
   ```
   This will start both the backend (on port 8000) and frontend (on port 3000) services.

### Development Notes
- The backend service runs in development mode with hot-reload
- SQLite database is used in development
- Static files are served from a Docker volume
- Code changes will automatically reload the development server

## Alternative Local Setup (without Docker)

1. Make sure you have Python 3.11+ installed
2. Install Poetry (package manager)
3. Install dependencies:
   ```bash
   poetry install
   ```
4. Activate the virtual environment:
   ```bash
   poetry shell
   ```
5. Run migrations:
   ```bash
   python manage.py migrate
   ```
6. Start the development server:
   ```bash
   python manage.py runserver
   ```

## Development Tools

- Code formatting is handled by Black
- Code linting is handled by Flake8

To run the formatters and linters:
```bash
poetry run black .
poetry run flake8
``` 