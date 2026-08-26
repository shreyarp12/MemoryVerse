from werkzeug.security import generate_password_hash, check_password_hash
from database.db import get_db_connection

def register_user(full_name, email, password, avatar='bunny.png'):
    conn = get_db_connection()
    try:
        pw_hash = generate_password_hash(password)
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO users (full_name, email, password_hash, avatar) VALUES (?, ?, ?, ?)',
            (full_name.strip(), email.strip().lower(), pw_hash, avatar)
        )
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        print(f"Error registering user: {e}")
        return None
    finally:
        conn.close()

def login_user(email, password):
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email.strip().lower(),)).fetchone()
    conn.close()
    if user and check_password_hash(user['password_hash'], password):
        return dict(user)
    return None

def get_user_by_id(user_id):
    conn = get_db_connection()
    user = conn.execute('SELECT id, full_name, email, avatar, created_at FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    return dict(user) if user else None

def email_exists(email):
    conn = get_db_connection()
    user = conn.execute('SELECT id FROM users WHERE email = ?', (email.strip().lower(),)).fetchone()
    conn.close()
    return user is not None

def update_user_profile(user_id, full_name, avatar=None):
    conn = get_db_connection()
    if avatar:
        conn.execute('UPDATE users SET full_name = ?, avatar = ? WHERE id = ?', (full_name.strip(), avatar, user_id))
    else:
        conn.execute('UPDATE users SET full_name = ? WHERE id = ?', (full_name.strip(), user_id))
    conn.commit()
    conn.close()
def reset_user_password(email, new_password):
    conn = get_db_connection()
    user = conn.execute('SELECT id FROM users WHERE email = ?', (email.strip().lower(),)).fetchone()
    if not user:
        conn.close()
        return False
    
    pw_hash = generate_password_hash(new_password)
    conn.execute('UPDATE users SET password_hash = ? WHERE id = ?', (pw_hash, user['id']))
    conn.commit()
    conn.close()
    return True