# What Digital Task

This repository contains a full-stack application with a Django backend and a Next.js frontend.

## Deployment Workflow

The application uses GitHub Actions for CI/CD with the following workflow:

### Automatic Deployments

- **Push to `dev` branch**: Automatically deploys to the **test environment**
- **Push to `main` branch**: Automatically deploys to the **live/production environment**

### CI/CD Pipeline

The CI/CD pipeline consists of the following steps:

1. **Test**: Runs Python code quality checks (black, flake8) and Django tests
2. **Build**: Builds and tests the Docker image
3. **Deploy**: Deploys to the appropriate environment based on the branch:
   - `dev` branch → test environment
   - `main` branch → live environment

## Development Setup

### Prerequisites

- Docker and Docker Compose
- Node.js (v18+)
- Python 3.11

### Local Development

1. Clone the repository:
   ```
   git clone https://github.com/your-org/what-digital-task.git
   cd what-digital-task
   ```

2. Start the development environment:
   ```
   docker-compose -f docker-compose.dev.yml up
   ```

3. Access the applications:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api

## Project Structure

- `/frontend`: Next.js frontend application
- `/backend`: Django backend application
- `/.github/workflows`: CI/CD configuration

## Contributing

1. Create a feature branch from `dev`
2. Make your changes
3. Submit a pull request to the `dev` branch
4. After review and testing in the test environment, changes will be merged to `main` for production deployment 