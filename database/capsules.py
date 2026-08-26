from datetime import datetime, date
from database.db import get_db_connection

def add_capsule(user_id, title, message, open_date, photo=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO capsules (user_id, title, message, photo, open_date)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, title.strip(), message.strip(), photo, open_date))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id

def get_capsules(user_id):
    conn = get_db_connection()
    capsules = conn.execute(
        'SELECT * FROM capsules WHERE user_id = ? ORDER BY open_date ASC',
        (user_id,)
    ).fetchall()
    conn.close()
    
    result = []
    today = date.today()
    for cap in capsules:
        c_dict = dict(cap)
        cap_date = datetime.strptime(c_dict['open_date'], '%Y-%m-%d').date()
        c_dict['is_unlocked'] = cap_date <= today
        result.append(c_dict)
    return result

def get_capsule(capsule_id, user_id):
    conn = get_db_connection()
    capsule = conn.execute(
        'SELECT * FROM capsules WHERE id = ? AND user_id = ?',
        (capsule_id, user_id)
    ).fetchone()
    conn.close()
    if not capsule:
        return None
    
    c_dict = dict(capsule)
    cap_date = datetime.strptime(c_dict['open_date'], '%Y-%m-%d').date()
    c_dict['is_unlocked'] = cap_date <= date.today()
    return c_dict

def update_capsule(capsule_id, user_id, title, message, open_date, photo=None):
    conn = get_db_connection()
    if photo:
        conn.execute('''
            UPDATE capsules SET title = ?, message = ?, open_date = ?, photo = ?
            WHERE id = ? AND user_id = ?
        ''', (title.strip(), message.strip(), open_date, photo, capsule_id, user_id))
    else:
        conn.execute('''
            UPDATE capsules SET title = ?, message = ?, open_date = ?
            WHERE id = ? AND user_id = ?
        ''', (title.strip(), message.strip(), open_date, capsule_id, user_id))
    conn.commit()
    conn.close()
