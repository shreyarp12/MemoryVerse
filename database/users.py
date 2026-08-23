import sqlite3

DATABASE = "database.db"


def connect_db():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


# -------------------------------
# Register User
# -------------------------------

def register_user(fullname, email, password):

    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO users(fullname,email,password)
        VALUES(?,?,?)
        """,
        (fullname, email, password)
    )

    conn.commit()
    conn.close()


# -------------------------------
# Check Email Exists
# -------------------------------

def email_exists(email):

    conn = connect_db()

    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM users WHERE email=?",
        (email,)
    )

    user = cursor.fetchone()

    conn.close()

    return user


# -------------------------------
# Login User
# -------------------------------

def login_user(email, password):

    conn = connect_db()

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT * FROM users
        WHERE email=? AND password=?
        """,
        (email, password)
    )

    user = cursor.fetchone()

    conn.close()

    return user