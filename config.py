import os

class Config:
    SECRET_KEY = "memoryverse_secret_key"

    DATABASE = os.path.join(
        os.path.abspath(os.path.dirname(__file__)),
        "database.db"
    )

    UPLOAD_FOLDER = "static/uploads"

    MAX_CONTENT_LENGTH = 16 * 1024 * 1024