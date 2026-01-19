#!/bin/bash
# Startup script for Railway deployment
# Tries multiple Python paths to handle different Railway/Nixpacks configurations

echo "Starting Semantle backend server..."
echo "PORT environment variable: ${PORT:-8000}"

# Check for Railway's virtual environment first
if [ -f "/opt/venv/bin/python" ]; then
    echo "Using /opt/venv/bin/python"
    exec /opt/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
# Check for python3 in PATH
elif command -v python3 &> /dev/null; then
    echo "Using python3 from PATH"
    exec python3 -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
# Check for python in PATH
elif command -v python &> /dev/null; then
    echo "Using python from PATH"
    exec python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
else
    echo "Error: Python not found. Tried:"
    echo "  - /opt/venv/bin/python"
    echo "  - python3"
    echo "  - python"
    echo "PATH: $PATH"
    exit 1
fi
