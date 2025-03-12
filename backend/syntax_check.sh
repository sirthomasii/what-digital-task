#!/bin/bash

echo "Running Black..."
black . --check

echo "Running Flake8..."
flake8 .

echo "Running MyPy..."
mypy .

# If any of the commands fail, the script will exit with a non-zero status 