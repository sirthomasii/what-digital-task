# What Digital Task - Backend

This is the backend service for the What Digital Task project, built with Django and Django REST Framework.

## Setup

1. Make sure you have Python 3.10+ installed
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

## Development

- Code formatting is handled by Black
- Code linting is handled by Flake8
- Type checking is handled by MyPy

To run the formatters and linters:
```bash
poetry run black .
poetry run flake8
poetry run mypy .
``` 