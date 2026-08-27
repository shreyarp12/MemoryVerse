import sqlite3
import os
from config import Config

def get_db_connection():
    os.makedirs(os.path.dirname(Config.DATABASE_PATH), exist_ok=True)
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    
    # --- AUTO-UPDATE SCHEMA HACK ---
    # Try to add the pin_hash column. If it already exists, SQLite will 
    # throw an OperationalError, which we can safely ignore!
    try:
        conn.execute('ALTER TABLE users ADD COLUMN pin_hash TEXT')
        conn.commit()
    except sqlite3.OperationalError:
        pass # Column already exists, do nothing
    # -------------------------------
    
    return conn