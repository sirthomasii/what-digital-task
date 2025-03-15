import os
import tempfile

# Try to ensure log directory exists, with fallback
log_dir = "/app/logs"
try:
    os.makedirs(log_dir, exist_ok=True)
    # Test if directory is writable
    test_file = os.path.join(log_dir, "test_write.tmp")
    try:
        with open(test_file, "w") as f:
            f.write("test")
        os.remove(test_file)
    except (IOError, PermissionError):
        # If not writable, use temp directory
        log_dir = tempfile.gettempdir()
except (IOError, PermissionError):
    # If can't create directory, use temp directory
    log_dir = tempfile.gettempdir()

print(f"Using log directory: {log_dir}")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {
            "format": "[{levelname}] {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
        "file": {
            "level": "WARNING",
            "class": "logging.FileHandler",
            "filename": os.path.join(log_dir, "django.log"),
            "formatter": "simple",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },
        "django.db.backends": {
            "handlers": ["file"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}
