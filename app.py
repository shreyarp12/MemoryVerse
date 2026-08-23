from turtle import title

from flask import Flask, render_template, request, redirect, session
import os
from config import Config

from database.users import (
    register_user,
    email_exists,
    login_user
)

from database.journals import (
    add_journal,
    get_all_journals,
    get_journal
)
from database.scrapbook import (
    add_scrapbook,
    get_all_scrapbooks,
    get_scrapbook
)

app = Flask(__name__)
app.config.from_object(Config)

app.secret_key = "memoryverse_secret_key"

# ==========================================
# Splash Screen
# ==========================================

@app.route("/")
def splash():
    return render_template("splash.html")


# ==========================================
# Login
# ==========================================

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        email = request.form["email"]
        password = request.form["password"]

        user = login_user(email, password)

        if user:
            return redirect("/home")

        return "Invalid Email or Password"

    return render_template("login.html")


# ==========================================
# Signup
# ==========================================

@app.route("/signup", methods=["GET", "POST"])
def signup():

    if request.method == "POST":

        fullname = request.form["fullname"]
        email = request.form["email"]
        password = request.form["password"]
        confirm_password = request.form["confirm_password"]

        if password != confirm_password:
            return "Passwords do not match!"

        if email_exists(email):
            return "Email already exists!"

        register_user(fullname, email, password)

        return redirect("/login")

    return render_template("signup.html")


# ==========================================
# Home
# ==========================================

@app.route("/home")
def home():
    return render_template("home.html")


# ==========================================
# Journal List
# ==========================================

@app.route("/journal")
def journal():

    user_id = 1

    journals = get_all_journals(user_id)

    return render_template(
        "journal.html",
        journals=journals
    )


# ==========================================
# Create Journal
# ==========================================

@app.route("/create-journal", methods=["GET", "POST"])
def create_journal():

    if request.method == "POST":

        title = request.form["title"]
        content = request.form["content"]

        favorite = 1 if "favorite" in request.form else 0
        locked = 1 if "locked" in request.form else 0

        photo = request.files["photo"]

        filename = ""

        if photo.filename != "":

            filename = photo.filename

            photo.save("static/uploads/journals/" + filename)

        add_journal(
            1,
            title,
            content,
            filename,
            favorite,
            locked
        )

        return redirect("/journal")

    return render_template("create_journal.html")


# ==========================================
# Journal Details
# ==========================================

@app.route("/journal/<int:journal_id>")
def journal_details(journal_id):

    journal = get_journal(journal_id)

    if journal is None:
        return redirect("/journal")

    return render_template(
        "journal_details.html",
        journal=journal
    )


# ==========================================
# Edit Journal
# ==========================================

@app.route("/edit-journal")
def edit_journal():
    return render_template("edit_journal.html")
# ==========================================
# Scrapbook
# ==========================================

@app.route("/scrapbook")
def scrapbook():

    scrapbooks = get_all_scrapbooks(1)

    return render_template(
        "scrapbook.html",
        scrapbooks=scrapbooks
    )
# ==========================================
# Create Scrapbook
# ==========================================

@app.route("/create-scrapbook", methods=["GET", "POST"])
def create_scrapbook():

    if request.method == "POST":

        title = request.form.get("title")

        background = request.form.get("background")

        cover = request.files.get("cover")

        filename = ""

        if cover and cover.filename != "":

            upload_folder = "static/uploads/scrapbook"

            os.makedirs(upload_folder, exist_ok=True)

            filename = cover.filename

            cover.save(
                os.path.join(upload_folder, filename)
            )
            add_scrapbook(
    1,
    title,
    background,
    filename
)

        session["scrapbook_title"] = title
        session["scrapbook_background"] = background
        session["scrapbook_cover"] = filename

        return redirect("/scrapbook-editor")

    return render_template("create_scrapbook.html")


# ==========================================
# Scrapbook Editor
# ==========================================

@app.route("/scrapbook-editor")
def scrapbook_editor():

    return render_template(

        "scrapbook_editor.html",

        title=session.get("scrapbook_title", ""),

        background=session.get("scrapbook_background", ""),

        cover=session.get("scrapbook_cover", "")

    )

# ==========================================
# Time Capsule
# ==========================================

@app.route("/time-capsule")
def time_capsule():
    return render_template("time_capsule.html")


@app.route("/create-capsule")
def create_capsule():
    return render_template("create_capsule.html")


# ==========================================
# Mood Tracker
# ==========================================

@app.route("/mood-tracker")
def mood_tracker():
    return render_template("mood_tracker.html")


# ==========================================
# Profile
# ==========================================

@app.route("/profile")
def profile():
    return render_template("profile.html")
# ==========================================
# Settings
# ==========================================

@app.route("/settings")
def settings():
    return render_template("settings.html")


# ==========================================
# Search
# ==========================================

@app.route("/search")
def search():
    return render_template("search.html")


# ==========================================
# Favorites
# ==========================================

@app.route("/favorites")
def favorites():
    return render_template("favorites.html")


# ==========================================
# Lock Screen
# ==========================================

@app.route("/lock")
def lock():
    return render_template("lock_screen.html")


# ==========================================
# Forgot Password
# ==========================================

@app.route("/forgot-password")
def forgot_password():
    return render_template("forgot_password.html")


# ==========================================
# Error Page
# ==========================================

@app.route("/error")
def error():
    return render_template("error.html")


# ==========================================
# Run App
# ==========================================

if __name__ == "__main__":
    app.run(debug=True)