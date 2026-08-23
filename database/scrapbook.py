import sqlite3

DATABASE = "database.db"


def connect_db():

    conn = sqlite3.connect(DATABASE)

    conn.row_factory = sqlite3.Row

    return conn


# --------------------------------
# Save Scrapbook
# --------------------------------

def add_scrapbook(user_id, title, background, cover):

    conn = connect_db()

    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO scrapbooks
        (user_id, title, background, cover)
        VALUES (?, ?, ?, ?)
        """,
        (
            user_id,
            title,
            background,
            cover
        )
    )

    conn.commit()

    conn.close()


# --------------------------------
# Get All Scrapbooks
# --------------------------------

def get_all_scrapbooks(user_id):

    conn = connect_db()

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT *
        FROM scrapbooks
        WHERE user_id=?
        ORDER BY created_at DESC
        """,
        (user_id,)
    )

    scrapbooks = cursor.fetchall()

    conn.close()

    return scrapbooks


# --------------------------------
# Get One Scrapbook
# --------------------------------

def get_scrapbook(scrapbook_id):

    conn = connect_db()

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT *
        FROM scrapbooks
        WHERE id=?
        """,
        (scrapbook_id,)
    )

    scrapbook = cursor.fetchone()

    conn.close()

    return scrapbook