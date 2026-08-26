import json
from database.db import get_db_connection

def create_scrapbook(user_id, title, background="#FFF8CF", cover=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO scrapbooks (user_id, title, cover, background)
        VALUES (?, ?, ?, ?)
    ''', (user_id, title.strip(), cover, background))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id

def get_scrapbooks(user_id):
    conn = get_db_connection()
    scrapbooks = conn.execute('''
        SELECT s.*, COUNT(i.id) as item_count 
        FROM scrapbooks s
        LEFT JOIN scrapbook_items i ON s.id = i.scrapbook_id
        WHERE s.user_id = ?
        GROUP BY s.id
        ORDER BY s.updated_at DESC
    ''', (user_id,)).fetchall()
    conn.close()
    return [dict(s) for s in scrapbooks]

def get_scrapbook(scrapbook_id, user_id):
    conn = get_db_connection()
    sb = conn.execute(
        'SELECT * FROM scrapbooks WHERE id = ? AND user_id = ?',
        (scrapbook_id, user_id)
    ).fetchone()
    if not sb:
        conn.close()
        return None
    
    items = conn.execute(
        'SELECT * FROM scrapbook_items WHERE scrapbook_id = ? ORDER BY z_index ASC, id ASC',
        (scrapbook_id,)
    ).fetchall()
    conn.close()
    
    sb_dict = dict(sb)
    sb_dict['items'] = [dict(item) for item in items]
    return sb_dict

def save_scrapbook_items(scrapbook_id, user_id, title, background, items):
    conn = get_db_connection()
    sb = conn.execute('SELECT id FROM scrapbooks WHERE id = ? AND user_id = ?', (scrapbook_id, user_id)).fetchone()
    if not sb:
        conn.close()
        return False

    cursor = conn.cursor()
    cursor.execute('''
        UPDATE scrapbooks SET title = ?, background = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (title.strip(), background, scrapbook_id))

    cursor.execute('DELETE FROM scrapbook_items WHERE scrapbook_id = ?', (scrapbook_id,))

    for item in items:
        cursor.execute('''
            INSERT INTO scrapbook_items (scrapbook_id, type, content, x, y, width, height, rotation, z_index, extra_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            scrapbook_id,
            item.get('type', 'sticker'),
            item.get('content', ''),
            float(item.get('x', 50)),
            float(item.get('y', 50)),
            float(item.get('width', 120)),
            float(item.get('height', 120)),
            float(item.get('rotation', 0)),
            int(item.get('z_index', 1)),
            json.dumps(item.get('extra_data', {})) if isinstance(item.get('extra_data'), dict) else str(item.get('extra_data', ''))
        ))

    conn.commit()
    conn.close()
    return True

def delete_scrapbook(scrapbook_id, user_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM scrapbooks WHERE id = ? AND user_id = ?', (scrapbook_id, user_id))
    conn.commit()
    conn.close()
