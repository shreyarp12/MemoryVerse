from database.db import get_db_connection

def add_mood(user_id, mood, note=""):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO moods (user_id, mood, note) VALUES (?, ?, ?)',
        (user_id, mood, note.strip())
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id

def get_moods(user_id, limit=30):
    conn = get_db_connection()
    moods = conn.execute(
        'SELECT * FROM moods WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
        (user_id, limit)
    ).fetchall()
    conn.close()
    return [dict(m) for m in moods]

def get_mood_statistics(user_id):
    conn = get_db_connection()
    stats = conn.execute('''
        SELECT mood, COUNT(*) as count 
        FROM moods 
        WHERE user_id = ? 
        GROUP BY mood
    ''', (user_id,)).fetchall()
    conn.close()
    return {row['mood']: row['count'] for row in stats}
