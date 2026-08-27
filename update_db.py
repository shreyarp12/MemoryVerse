import sqlite3
import os

# Use the correct path based on your folder structure
db_path = os.path.join('database', 'memoryverse.db')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Add the new pin_hash column
    cursor.execute('ALTER TABLE users ADD COLUMN pin_hash TEXT')
    print("Successfully added pin_hash column to users table! ✨")
except sqlite3.OperationalError as e:
    print(f"Notice: {e} (The column probably already exists!)")

conn.commit()
conn.close()