# Student Management System (EduManage)

A modern, responsive full-stack **Student Management System** built with **Python (Flask)**, **MySQL**, and a sleek **Bootstrap 5 & Vanilla JS** administrative dashboard.

---

## 🌟 Key Features

- **Executive Dashboard:** Live summary metrics (Total Enrolled, Academic Departments, Active Programs, Recent Admissions), visual department distribution, and quick action controls.
- **Interactive Student Directory:** High-performance tabular view with avatars, institutional ID badges, department tags, and instant view/edit/delete actions.
- **Search & Filtering:** Real-time debounced search by name, student ID, email, or phone number, with department, course, and gender filters.
- **Pagination & Page Sizing:** Configurable records per page (5, 8, 15, 25) with smooth pagination controls.
- **Add & Edit Modals:** 2-column responsive forms with auto-generated unique Student IDs, field validations, and error toasts.
- **Student Profile View:** Dedicated profile modal featuring hero gradient card, initials avatar, academic details, and printable format.
- **Safe Record Deletion:** Confirmation dialog preventing accidental data loss.
- **Dark / Light Theme:** Persistent theme toggle stored in `localStorage`.
- **CSV Data Export:** Export the complete student records dataset into a `.csv` spreadsheet with one click.
- **Live MySQL Health Badge:** Real-time database connection status indicator on the dashboard sidebar.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3 (Custom Glassmorphism Design System), Vanilla JavaScript (ES6+), Bootstrap 5.3.3, Bootstrap Icons 1.11.3 |
| **Backend** | Python 3, Flask 3.x, Flask-CORS |
| **Database** | MySQL Server (Database: `student_management`, Table: `students`) |
| **DB Driver** | PyMySQL with parameterized queries & dictionary cursor |
| **Configuration** | python-dotenv (`.env`) |
| **IDE** | Visual Studio Code (`.vscode/settings.json` & `.vscode/launch.json` included) |

---

## 🗄️ Database Schema

Database Name: `student_management`  
Table: `students`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT` | `AUTO_INCREMENT PRIMARY KEY` | Auto-incrementing identifier |
| `student_id` | `VARCHAR(50)` | `NOT NULL UNIQUE` | Institutional student ID (e.g. `STU-2024-001`) |
| `full_name` | `VARCHAR(150)` | `NOT NULL` | Student full legal name |
| `email` | `VARCHAR(150)` | `NOT NULL UNIQUE` | Institutional/personal email address |
| `phone` | `VARCHAR(30)` | `NOT NULL` | Contact telephone number |
| `date_of_birth` | `DATE` | `NOT NULL` | Date of birth (YYYY-MM-DD) |
| `gender` | `VARCHAR(20)` | `NOT NULL` | Male, Female, Other |
| `course` | `VARCHAR(100)` | `NOT NULL` | Academic degree / program |
| `department` | `VARCHAR(100)` | `NOT NULL` | Faculty or department |
| `address` | `TEXT` | `NOT NULL` | Full residential address |
| `enrollment_date` | `DATE` | `NOT NULL` | Admission date (YYYY-MM-DD) |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | System creation timestamp |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | System update timestamp |

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have Python 3.10+ and a MySQL Server running locally.

### 2. Environment Configuration
Edit or review the `.env` file in the project root:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=student_management

PORT=5000
FLASK_DEBUG=1
SECRET_KEY=super-secret-student-management-key-2026
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Initialize Database & Seed Sample Records
Run the initialization script to automatically create the `student_management` database, the `students` table, and seed realistic demo students:
```bash
python init_db.py
```

### 5. Run the Application
Start the Flask development server:
```bash
python app.py
```
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 📡 RESTful API Documentation

| Method | Endpoint | Description | Query Parameters / Body | Status Code |
|---|---|---|---|---|
| `GET` | `/` | Serves the web dashboard | None | `200 OK` |
| `GET` | `/api/health` | Live MySQL connection health check | None | `200 OK` |
| `GET` | `/api/stats` | Dashboard statistics & analytics | None | `200 OK` |
| `GET` | `/api/students` | Retrieve students with search & filters | `search`, `department`, `course`, `gender`, `page`, `limit`, `sort_by`, `order` | `200 OK` |
| `GET` | `/api/students/<id>` | Retrieve single student by ID | Path parameter: `id` | `200 OK` / `404 Not Found` |
| `POST` | `/api/students` | Create new student | JSON payload containing all required fields | `201 Created` / `400 Bad Request` / `409 Conflict` |
| `PUT` | `/api/students/<id>` | Update student information | Path parameter `id` + JSON payload | `200 OK` / `400 Bad Request` / `404 Not Found` / `409 Conflict` |
| `DELETE` | `/api/students/<id>` | Delete student record | Path parameter: `id` | `200 OK` / `404 Not Found` |
| `GET` | `/api/departments` | Distinct list of departments and courses | None | `200 OK` |

---

## 💻 Running in Visual Studio Code
1. Open Visual Studio Code.
2. Open this project directory.
3. Press `F5` or click **Run > Start Debugging** to launch the project using the preconfigured `.vscode/launch.json`.

---

## 🌐 Cloud Deployment Guide

Because this application uses **Flask** and **MySQL**, deployment requires hosting both the Python web application and the MySQL database. Here are the 3 best platforms:

### Option 1: Railway (Easiest - Flask + MySQL in One Project)
[Railway.app](https://railway.app/) provides native support for both Python services and MySQL with zero configuration.

1. **Push your code to GitHub** (see GitHub section below).
2. Go to [railway.app](https://railway.app/) and sign in with GitHub.
3. Click **"New Project" > "Provision MySQL"**.
4. In the same project, click **"New" > "GitHub Repo"** and select `Student-Management-System-Project`.
5. Railway will automatically detect the `Procfile` and `requirements.txt`.
6. In your web service settings, add Environment Variables referencing your MySQL service:
   - `DB_HOST`: `${{MySQL.MYSQLHOST}}`
   - `DB_PORT`: `${{MySQL.MYSQLPORT}}`
   - `DB_USER`: `${{MySQL.MYSQLUSER}}`
   - `DB_PASSWORD`: `${{MySQL.MYSQLPASSWORD}}`
   - `DB_NAME`: `${{MySQL.MYSQLDATABASE}}`
   - `SECRET_KEY`: A secure random string
7. Railway will deploy your app and provide a public `https://...up.railway.app` URL. The database tables initialize automatically on startup!

---

### Option 2: Render + Free Hosted MySQL (TiDB / Aiven / Clever Cloud)
[Render](https://render.com/) offers a free tier for Web Services:

1. **Host MySQL database**:
   - Create a free MySQL instance on [Aiven.io](https://aiven.io/), [TiDB Cloud](https://tidbcloud.com/), or [Clever Cloud](https://www.clever-cloud.com/).
   - Copy your database host, port, user, password, and database name.
2. **Deploy on Render**:
   - Sign up at [render.com](https://render.com/) and connect your GitHub account.
   - Click **"New" > "Web Service"** and select `Student-Management-System-Project`.
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
   - Add Environment Variables:
     - `DB_HOST`
     - `DB_PORT`
     - `DB_USER`
     - `DB_PASSWORD`
     - `DB_NAME`
     - `SECRET_KEY`
3. Click **"Create Web Service"**. Render will build and deploy your project with HTTPS enabled.

---

### Option 3: PythonAnywhere (Free Student Friendly)
[PythonAnywhere](https://www.pythonanywhere.com/) provides free Python hosting with built-in MySQL:

1. Sign up for a free account at [pythonanywhere.com](https://www.pythonanywhere.com/).
2. Under the **Databases** tab, initialize your free MySQL database and note your database credentials and database name (`yourusername$student_management`).
3. Open a **Bash Console** and clone your repo:
   ```bash
   git clone https://github.com/2004sudeeptalawar-art/Student-Management-System-Project.git
   cd Student-Management-System-Project
   pip install --user -r requirements.txt
   python init_db.py
   ```
4. Under the **Web** tab, create a new Flask web app pointing to your virtualenv and `app.py`.
5. Set environment variables in your WSGI configuration or `.env` file and click **Reload**.

---

## 🔗 Syncing with GitHub

To push your latest changes or link your repository:

```bash
# 1. Check changed files
git status

# 2. Stage all changes
git add .

# 3. Commit changes
git commit -m "feat: add gunicorn, Procfile, cloud DB init, and GitHub links"

# 4. Push to GitHub
git push origin main
```

Your GitHub repository:  
👉 **[https://github.com/2004sudeeptalawar-art/Student-Management-System-Project](https://github.com/2004sudeeptalawar-art/Student-Management-System-Project)**

