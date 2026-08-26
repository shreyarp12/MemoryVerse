from datetime import datetime, timedelta
from database.db import get_db_connection

def add_journal(user_id, title, content, mood='😊', photo=None, favorite=0, locked=0):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO journals (user_id, title, content, mood, photo, favorite, locked)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, title.strip(), content.strip(), mood, photo, favorite, locked))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id

def get_all_journals(user_id, search_query=None):
    conn = get_db_connection()
    if search_query:
        query = '''
            SELECT * FROM journals 
            WHERE user_id = ? AND (title LIKE ? OR content LIKE ?)
            ORDER BY created_at DESC
        '''
        term = f"%{search_query.strip()}%"
        journals = conn.execute(query, (user_id, term, term)).fetchall()
    else:
        journals = conn.execute(
            'SELECT * FROM journals WHERE user_id = ? ORDER BY created_at DESC', 
            (user_id,)
        ).fetchall()
    conn.close()
    return [dict(j) for j in journals]

def get_journal(journal_id, user_id):
    conn = get_db_connection()
    journal = conn.execute(
        'SELECT * FROM journals WHERE id = ? AND user_id = ?', 
        (journal_id, user_id)
    ).fetchone()
    conn.close()
    return dict(journal) if journal else None

def update_journal(journal_id, user_id, title, content, mood, photo=None, favorite=0, locked=0):
    conn = get_db_connection()
    if photo:
        conn.execute('''
            UPDATE journals 
            SET title = ?, content = ?, mood = ?, photo = ?, favorite = ?, locked = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
        ''', (title.strip(), content.strip(), mood, photo, favorite, locked, journal_id, user_id))
    else:
        conn.execute('''
            UPDATE journals 
            SET title = ?, content = ?, mood = ?, favorite = ?, locked = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
        ''', (title.strip(), content.strip(), mood, favorite, locked, journal_id, user_id))
    conn.commit()
    conn.close()

def delete_journal(journal_id, user_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM journals WHERE id = ? AND user_id = ?', (journal_id, user_id))
    conn.commit()
    conn.close()

def get_favorites(user_id):
    conn = get_db_connection()
    favs = conn.execute(
        'SELECT * FROM journals WHERE user_id = ? AND favorite = 1 ORDER BY created_at DESC', 
        (user_id,)
    ).fetchall()
    conn.close()
    return [dict(f) for f in favs]

def calculate_streak(user_id):
    conn = get_db_connection()
    rows = conn.execute('''
        SELECT DISTINCT DATE(created_at) as entry_date 
        FROM journals 
        WHERE user_id = ? 
        ORDER BY entry_date DESC
    ''', (user_id,)).fetchall()
    conn.close()

    if not rows:
        return 0

    dates = {datetime.strptime(r['entry_date'], '%Y-%m-%d').date() for r in rows}
    today = datetime.now().date()
    yesterday = today - timedelta(days=1)

    if today in dates:
        current_check = today
    elif yesterday in dates:
        current_check = yesterday
    else:
        return 0

    streak = 0
    while current_check in dates:
        streak += 1
        current_check -= timedelta(days=1)

    return streak

def get_memory_from_past(user_id):
    conn = get_db_connection()
    today = datetime.now()
    current_year = today.strftime('%Y')
    
    memory = conn.execute('''
        SELECT * FROM journals 
        WHERE user_id = ? 
        AND strftime('%m-%d', created_at) = strftime('%m-%d', 'now')
        AND strftime('%Y', created_at) < ?
        ORDER BY created_at ASC LIMIT 1
    ''', (user_id, current_year)).fetchone()
    
    conn.close()
    return dict(memory) if memory else None