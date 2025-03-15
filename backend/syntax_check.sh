#!/bin/bash

echo "Running Black..."
black . --check

echo "Running Flake8..."
flake8 .

# If any of the commands fail, the script will exit with a non-zero status 