import os
from functools import wraps
from datetime import datetime
from werkzeug.utils import secure_filename
from flask import Flask, json, render_template, request, redirect, url_for, session, flash, jsonify

from config import Config
from database.users import (
    register_user, login_user, get_user_by_id, email_exists, 
    update_user_profile, reset_user_password, update_user_pin, verify_user_pin
)
from database.journals import (
    add_journal, get_all_journals, get_journal, update_journal, 
    delete_journal, get_favorites, calculate_streak, get_memory_from_past
)
from database.moods import add_mood, get_moods, get_mood_statistics
from database.capsules import add_capsule, get_capsules, get_capsule
from database.scrapbooks import (
    create_scrapbook, get_scrapbooks, get_scrapbook, 
    save_scrapbook_items, delete_scrapbook
)

app = Flask(__name__)
app.config.from_object(Config)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash("Please sign in to view this page 🌸", "info")
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.context_processor
def inject_user():
    if 'user_id' in session:
        user = get_user_by_id(session['user_id'])
        return dict(current_user=user)
    return dict(current_user=None)

# ----------------- AUTH ROUTES -----------------

@app.route('/')
def splash():
    if 'user_id' in session:
        return redirect(url_for('home'))
    return render_template('splash.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if 'user_id' in session:
        return redirect(url_for('home'))

    if request.method == 'POST':
        full_name = request.form.get('full_name', '').strip()
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        avatar = request.form.get('avatar', 'bunny.png')

        if not full_name or not email or not password:
            flash("Please fill in all required fields ✨", "error")
            return render_template('signup.html')

        if len(password) < 6:
            flash("Password must be at least 6 characters long 🔐", "error")
            return render_template('signup.html')

        if password != confirm_password:
            flash("Passwords do not match! Please check again 🌸", "error")
            return render_template('signup.html')

        if email_exists(email):
            flash("An account with this email already exists! Try logging in 💌", "error")
            return render_template('signup.html')

        user_id = register_user(full_name, email, password, avatar)
        if user_id:
            flash("Account created successfully! Please sign in 💖", "success")
            return redirect(url_for('login'))
        else:
            flash("An error occurred during registration. Please try again.", "error")

    return render_template('signup.html')

@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if 'user_id' in session:
        return redirect(url_for('home'))

    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        new_password = request.form.get('new_password', '')
        confirm_password = request.form.get('confirm_password', '')

        if not email or not new_password or not confirm_password:
            flash("Please fill in all fields 🌸", "error")
            return render_template('forgot_password.html')

        if len(new_password) < 6:
            flash("New password must be at least 6 characters long 🔐", "error")
            return render_template('forgot_password.html')

        if new_password != confirm_password:
            flash("Passwords do not match! 🥺", "error")
            return render_template('forgot_password.html')

        if not email_exists(email):
            flash("No account found with this email address 💌", "error")
            return render_template('forgot_password.html')

        updated = reset_user_password(email, new_password)
        if updated:
            flash("Password updated successfully! Please sign in with your new password 💖", "success")
            return redirect(url_for('login'))
        else:
            flash("An error occurred. Please try again.", "error")

    return render_template('forgot_password.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('home'))

    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')

        if not email or not password:
            flash("Please enter both email and password 🎀", "error")
            return render_template('login.html')

        user = login_user(email, password)
        if user:
            session['user_id'] = user['id']
            session['user_name'] = user['full_name']
            flash(f"Welcome back, {user['full_name']}! 🌸", "success")
            return redirect(url_for('home'))
        else:
            flash("Invalid email or password. Please try again! 🥺", "error")

    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash("You have been signed out safely. Come back soon! 🐰✨", "info")
    return redirect(url_for('login'))

# ----------------- HOME DASHBOARD -----------------

@app.route('/home')
@login_required
def home():
    user_id = session['user_id']
    user = get_user_by_id(user_id)
    streak = calculate_streak(user_id)
    journals = get_all_journals(user_id)
    favorites = get_favorites(user_id)
    scrapbooks = get_scrapbooks(user_id)
    capsules = get_capsules(user_id)
    moods = get_moods(user_id, limit=7)
    past_memory = get_memory_from_past(user_id)

    current_hour = datetime.now().hour
    if current_hour < 12:
        greeting = "Good Morning ☀️"
    elif 12 <= current_hour < 17:
        greeting = "Good Afternoon 🌸"
    else:
        greeting = "Good Evening ✨"

    stats = {
        'total_journals': len(journals),
        'total_scrapbooks': len(scrapbooks),
        'total_capsules': len(capsules),
        'streak': streak
    }

    return render_template('home.html', user=user, greeting=greeting, stats=stats, 
                           recent_journals=journals[:3], favorites=favorites[:3], 
                           past_memory=past_memory, recent_moods=moods)

# ----------------- JOURNAL ROUTES -----------------

@app.route('/journal')
@login_required
def journal_list():
    user_id = session['user_id']
    query = request.args.get('search', '')
    journals = get_all_journals(user_id, search_query=query if query else None)
    return render_template('journal/journal.html', journals=journals, search_query=query)

@app.route('/journal/create', methods=['GET', 'POST'])
@login_required
def create_journal_route():
    user_id = session['user_id']
    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        content = request.form.get('content', '').strip()
        mood = request.form.get('mood', '😊')
        favorite = 1 if request.form.get('favorite') == '1' else 0
        locked = 1 if request.form.get('locked') == '1' else 0

        if not title or not content:
            flash("Title and Content cannot be empty! 📝", "error")
            return render_template('journal/create_journal.html')

        photo_filename = None
        if 'photo' in request.files:
            file = request.files['photo']
            if file and allowed_file(file.filename):
                fname = secure_filename(f"{int(datetime.now().timestamp())}_{file.filename}")
                file.save(os.path.join(Config.UPLOAD_FOLDER, 'journals', fname))
                photo_filename = fname

        add_journal(user_id, title, content, mood, photo_filename, favorite, locked)
        flash("Journal saved to your memories! 🌸", "success")
        return redirect(url_for('journal_list'))

    return render_template('journal/create_journal.html')

@app.route('/journal/<int:journal_id>')
@login_required
def view_journal(journal_id):
    user_id = session['user_id']
    journal = get_journal(journal_id, user_id)
    if not journal:
        flash("Memory not found! 🥺", "error")
        return redirect(url_for('journal_list'))
    return render_template('journal/view_journal.html', journal=journal)

@app.route('/journal/<int:journal_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_journal(journal_id):
    user_id = session['user_id']
    journal = get_journal(journal_id, user_id)
    if not journal:
        flash("Journal not found! 🥺", "error")
        return redirect(url_for('journal_list'))

    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        content = request.form.get('content', '').strip()
        mood = request.form.get('mood', '😊')
        favorite = 1 if request.form.get('favorite') == '1' else 0
        locked = 1 if request.form.get('locked') == '1' else 0

        photo_filename = journal['photo']
        if 'photo' in request.files:
            file = request.files['photo']
            if file and allowed_file(file.filename):
                fname = secure_filename(f"{int(datetime.now().timestamp())}_{file.filename}")
                file.save(os.path.join(Config.UPLOAD_FOLDER, 'journals', fname))
                photo_filename = fname

        update_journal(journal_id, user_id, title, content, mood, photo_filename, favorite, locked)
        flash("Memory updated successfully! ✨", "success")
        return redirect(url_for('view_journal', journal_id=journal_id))

    return render_template('journal/edit_journal.html', journal=journal)

@app.route('/journal/<int:journal_id>/delete', methods=['POST'])
@login_required
def delete_journal_route(journal_id):
    user_id = session['user_id']
    delete_journal(journal_id, user_id)
    flash("Memory deleted safely 🗑️", "info")
    return redirect(url_for('journal_list'))

# ----------------- TIME CAPSULE ROUTES -----------------

@app.route('/capsule')
@login_required
def capsule_list():
    user_id = session['user_id']
    capsules = get_capsules(user_id)
    return render_template('timecapsule/timecapsule.html', capsules=capsules)

@app.route('/capsule/create', methods=['GET', 'POST'])
@login_required
def create_capsule_route():
    user_id = session['user_id']
    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        message = request.form.get('message', '').strip()
        open_date = request.form.get('open_date', '')

        if not title or not message or not open_date:
            flash("Please fill in title, message, and target open date! ⏳", "error")
            return render_template('timecapsule/create_capsule.html')

        photo_filename = None
        if 'photo' in request.files:
            file = request.files['photo']
            if file and allowed_file(file.filename):
                fname = secure_filename(f"{int(datetime.now().timestamp())}_{file.filename}")
                file.save(os.path.join(Config.UPLOAD_FOLDER, 'journals', fname))
                photo_filename = fname

        add_capsule(user_id, title, message, open_date, photo_filename)
        flash("Time Capsule locked into the future! ⏳✨", "success")
        return redirect(url_for('capsule_list'))

    return render_template('timecapsule/create_capsule.html')

@app.route('/capsule/<int:capsule_id>')
@login_required
def view_capsule(capsule_id):
    user_id = session['user_id']
    capsule = get_capsule(capsule_id, user_id)
    if not capsule:
        flash("Capsule not found 🥺", "error")
        return redirect(url_for('capsule_list'))
    return render_template('timecapsule/view_capsule.html', capsule=capsule)

# ----------------- SCRAPBOOK ROUTES -----------------

@app.route('/scrapbook')
@login_required
def scrapbook_list():
    user_id = session['user_id']
    scrapbooks = get_scrapbooks(user_id)
    return render_template('scrapbook/scrapbook.html', scrapbooks=scrapbooks)

@app.route('/scrapbook/create', methods=['POST'])
@login_required
def create_scrapbook_route():
    user_id = session['user_id']
    title = request.form.get('title', 'My Aesthetic Scrapbook 🌸')
    sb_id = create_scrapbook(user_id, title)
    return redirect(url_for('scrapbook_editor', scrapbook_id=sb_id))

@app.route('/scrapbook/<int:scrapbook_id>')
@login_required
def scrapbook_editor(scrapbook_id):
    user_id = session['user_id']
    sb = get_scrapbook(scrapbook_id, user_id)
    if not sb:
        flash("Scrapbook not found 🎨", "error")
        return redirect(url_for('scrapbook_list'))
    
    # Pre-serialize items to JSON string safely in Python
    items_json = json.dumps(sb.get('items', []))
    
    return render_template('scrapbook/scrapbook_editor.html', scrapbook=sb, items_json=items_json)

@app.route('/scrapbook/<int:scrapbook_id>/view')
@login_required
def view_scrapbook(scrapbook_id):
    user_id = session['user_id']
    sb = get_scrapbook(scrapbook_id, user_id)
    if not sb:
        flash("Scrapbook not found 🎨", "error")
        return redirect(url_for('scrapbook_list'))
    return render_template('scrapbook/view_scrapbook.html', scrapbook=sb)

@app.route('/scrapbook/<int:scrapbook_id>/save', methods=['POST'])
@login_required
def save_scrapbook(scrapbook_id):
    user_id = session['user_id']
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Invalid data payload'}), 400

    title = data.get('title', 'My Scrapbook')
    background = data.get('background', '#FFF8CF')
    items = data.get('items', [])

    saved = save_scrapbook_items(scrapbook_id, user_id, title, background, items)
    if saved:
        return jsonify({'success': True, 'message': 'Scrapbook saved successfully! 💖'})
    return jsonify({'success': False, 'message': 'Failed to save scrapbook'}), 500

@app.route('/scrapbook/upload_image', methods=['POST'])
@login_required
def upload_scrapbook_image():
    if 'image' not in request.files:
        return jsonify({'success': False, 'message': 'No file uploaded'}), 400
    file = request.files['image']
    if file and allowed_file(file.filename):
        fname = secure_filename(f"sb_{int(datetime.now().timestamp())}_{file.filename}")
        file.save(os.path.join(Config.UPLOAD_FOLDER, 'scrapbook', fname))
        return jsonify({'success': True, 'url': url_for('static', filename=f'uploads/scrapbook/{fname}')})
    return jsonify({'success': False, 'message': 'Invalid file format'}), 400

@app.route('/scrapbook/<int:scrapbook_id>/delete', methods=['POST'])
@login_required
def delete_scrapbook_route(scrapbook_id):
    user_id = session['user_id']
    delete_scrapbook(scrapbook_id, user_id)
    flash("Scrapbook deleted 🗑️", "info")
    return redirect(url_for('scrapbook_list'))

# ----------------- MOOD TRACKER ROUTES -----------------

@app.route('/mood', methods=['GET', 'POST'])
@login_required
def mood_tracker():
    user_id = session['user_id']
    if request.method == 'POST':
        mood = request.form.get('mood', '😊')
        note = request.form.get('note', '').strip()
        add_mood(user_id, mood, note)
        flash("Mood recorded! You're doing amazing 💖", "success")
        return redirect(url_for('mood_history'))

    stats = get_mood_statistics(user_id)
    return render_template('mood/mood.html', stats=stats)

@app.route('/mood/history')
@login_required
def mood_history():
    user_id = session['user_id']
    moods = get_moods(user_id, limit=50)
    stats = get_mood_statistics(user_id)
    return render_template('mood/mood_history.html', moods=moods, stats=stats)

# ----------------- PROFILE & SETTINGS -----------------

@app.route('/profile')
@login_required
def profile():
    user_id = session['user_id']
    user = get_user_by_id(user_id)
    streak = calculate_streak(user_id)
    j_count = len(get_all_journals(user_id))
    s_count = len(get_scrapbooks(user_id))
    c_count = len(get_capsules(user_id))
    return render_template('profile/profile.html', user=user, streak=streak, 
                           journals_count=j_count, scrapbooks_count=s_count, capsules_count=c_count)

@app.route('/profile/update', methods=['POST'])
@login_required
def update_profile():
    user_id = session['user_id']
    full_name = request.form.get('full_name', '').strip()
    avatar = request.form.get('avatar', 'bunny.png')
    
    if full_name:
        update_user_profile(user_id, full_name, avatar)
        session['user_name'] = full_name
        flash("Profile updated! 🌸", "success")
    return redirect(url_for('profile'))

@app.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    if request.method == 'POST':
        pin = request.form.get('security_pin')
        
        # If user entered a PIN, update it
        if pin:
            if len(pin) == 4 and pin.isdigit():
                update_user_pin(session['user_id'], pin)
                flash("Settings and PIN updated successfully! ✨", "success")
            else:
                flash("PIN must be exactly 4 digits.", "error")
                return redirect(url_for('settings'))

        # (Save your reminder preferences here as well if you have them)
        return redirect(url_for('settings'))

    return render_template('profile/settings.html')


@app.route('/api/verify-pin', methods=['POST'])
@login_required
def verify_pin():
    data = request.get_json() or {}
    entered_pin = data.get('pin', '')
    user_id = session['user_id']

    if verify_user_pin(user_id, entered_pin):
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': 'Incorrect PIN or no PIN set. Try again.'}), 401


@app.route('/api/stickers/<category>')
@login_required
def get_sticker_category_assets(category):
    """Dynamically scan the static sticker folder and return existing filenames."""
    folder_path = os.path.join(app.root_path, 'static', 'images', 'stickers', category)
    if not os.path.exists(folder_path):
        return jsonify([])
    
    # Grab all png, jpg, jpeg, webp, and gif files in the folder
    files = [
        f for f in os.listdir(folder_path) 
        if os.path.isfile(os.path.join(folder_path, f)) and allowed_file(f)
    ]
    # Sort files naturally (e.g., animal1, animal2, ... animal10)
    files.sort()
    return jsonify(files)

if __name__ == '__main__':
    app.run(debug=True, port=5000)