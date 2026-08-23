import sqlite3

connection = sqlite3.connect("database.db")

cursor = connection.cursor()

# ---------------- USERS ----------------

cursor.execute("""
CREATE TABLE IF NOT EXISTS users(

id INTEGER PRIMARY KEY AUTOINCREMENT,

fullname TEXT NOT NULL,

email TEXT UNIQUE NOT NULL,

password TEXT NOT NULL

)
""")

# ---------------- JOURNALS ----------------

cursor.execute("""
CREATE TABLE IF NOT EXISTS journals(

id INTEGER PRIMARY KEY AUTOINCREMENT,

user_id INTEGER NOT NULL,

title TEXT NOT NULL,

content TEXT NOT NULL,

photo TEXT,

favorite INTEGER DEFAULT 0,

locked INTEGER DEFAULT 0,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

)
""")
# --------------------------------
# Scrapbooks Table
# --------------------------------

cursor.execute("""
CREATE TABLE IF NOT EXISTS scrapbooks (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER,

    title TEXT,

    background TEXT,

    cover TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

)
""")

# ---------------- MOOD ----------------

cursor.execute("""
CREATE TABLE IF NOT EXISTS moods(

id INTEGER PRIMARY KEY AUTOINCREMENT,

user_id INTEGER,

mood TEXT,

date TEXT

)
""")

# ---------------- TIME CAPSULE ----------------

cursor.execute("""
CREATE TABLE IF NOT EXISTS capsules(

id INTEGER PRIMARY KEY AUTOINCREMENT,

user_id INTEGER,

title TEXT,

message TEXT,

open_date TEXT

)
""")

connection.commit()

connection.close()

print("Database Created Successfully!")