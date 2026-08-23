import sqlite3

DATABASE = "database.db"


def connect_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


# --------------------------------
# Save Journal
# --------------------------------

def add_journal(user_id, title, content, photo, favorite, locked):

    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO journals
        (user_id, title, content, photo, favorite, locked)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            title,
            content,
            photo,
            favorite,
            locked
        )
    )

    conn.commit()
    conn.close()


# --------------------------------
# Get All Journals
# --------------------------------

def get_all_journals(user_id):

    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT *
        FROM journals
        WHERE user_id=?
        ORDER BY created_at DESC
        """,
        (user_id,)
    )

    journals = cursor.fetchall()

    conn.close()

    return journals


# --------------------------------
# Get One Journal
# --------------------------------


def get_journal(journal_id):

    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT *
        FROM journals
        WHERE id=?
        """,
        (journal_id,)
    )

    journal = cursor.fetchone()

    conn.close()

    return journal