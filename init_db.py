import os
from database.db import get_db_connection
from config import Config

def init_db():
    upload_subdirs = [
        os.path.join(Config.UPLOAD_FOLDER, 'journals'),
        os.path.join(Config.UPLOAD_FOLDER, 'scrapbook'),
        os.path.join(Config.UPLOAD_FOLDER, 'avatars')
    ]
    for path in upload_subdirs:
        os.makedirs(path, exist_ok=True)

    conn = get_db_connection()
    cursor = conn.cursor()

    # Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            avatar TEXT DEFAULT 'bunny.png',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ''')

    # Journals Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS journals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            mood TEXT DEFAULT '😊',
            photo TEXT,
            favorite INTEGER DEFAULT 0,
            locked INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
    ''')

    # Moods Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS moods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            mood TEXT NOT NULL,
            note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
    ''')

    # Capsules Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS capsules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            photo TEXT,
            open_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            opened INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
    ''')

    # Scrapbooks Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scrapbooks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            cover TEXT,
            background TEXT DEFAULT '#FFF8CF',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
    ''')

    # Scrapbook Items Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scrapbook_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scrapbook_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            content TEXT NOT NULL,
            x REAL DEFAULT 50.0,
            y REAL DEFAULT 50.0,
            width REAL DEFAULT 120.0,
            height REAL DEFAULT 120.0,
            rotation REAL DEFAULT 0.0,
            z_index INTEGER DEFAULT 1,
            extra_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (scrapbook_id) REFERENCES scrapbooks (id) ON DELETE CASCADE
        );
    ''')

    conn.commit()
    conn.close()
    print("🌸 MemoryVerse Database and Directories Initialized Successfully!")

if __name__ == '__main__':
    init_db()