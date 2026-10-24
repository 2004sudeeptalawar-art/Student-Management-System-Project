import os
import re
from datetime import date, datetime
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
import pymysql

from db import get_db_connection, init_database, DB_NAME, DB_HOST, DB_PORT

# Load environment configuration
load_dotenv()

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "student-mgmt-secret-2026")
CORS(app)

# Ensure database schema is initialized on startup (supports both local and Gunicorn/WSGI)
try:
    init_database()
except Exception as err:
    print(f"[Startup Warning] Deferred DB initialization: {err}")



def serialize_row(row):
    """Format MySQL row dates and datetimes into standard ISO strings."""
    if not row:
        return None
    data = dict(row)
    for key, val in data.items():
        if isinstance(val, (datetime, date)):
            data[key] = val.isoformat()
    return data


def validate_student_data(data, is_update=False):
    """Validate student record payload."""
    errors = []
    required_fields = [
        "student_id", "full_name", "email", "phone",
        "date_of_birth", "gender", "course", "department",
        "address", "enrollment_date"
    ]

    for field in required_fields:
        val = str(data.get(field, "")).strip()
        if not val:
            errors.append(f"'{field}' is required and cannot be empty.")

    email = str(data.get("email", "")).strip()
    if email and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        errors.append("Invalid email address format.")

    # Date format validation YYYY-MM-DD
    for d_field in ["date_of_birth", "enrollment_date"]:
        val = str(data.get(d_field, "")).strip()
        if val:
            try:
                datetime.strptime(val, "%Y-%m-%d")
            except ValueError:
                errors.append(f"'{d_field}' must follow YYYY-MM-DD format.")

    return errors


@app.route("/")
def index():
    """Serve the main student management dashboard."""
    return render_template("index.html")


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint showing database connectivity status."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT 1 AS alive;")
            cur.execute("SELECT COUNT(*) AS total FROM students;")
            total = cur.fetchone()["total"]
        conn.close()
        return jsonify({
            "success": True,
            "status": "healthy",
            "database": DB_NAME,
            "host": f"{DB_HOST}:{DB_PORT}",
            "students_count": total
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "status": "unhealthy",
            "error": str(e)
        }), 500


@app.route("/api/stats", methods=["GET"])
def get_stats():
    """Return dashboard analytics and summary metrics."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            # Total students
            cur.execute("SELECT COUNT(*) AS total FROM students;")
            total_students = cur.fetchone()["total"]

            # Department breakdown
            cur.execute("""
                SELECT department, COUNT(*) AS count 
                FROM students 
                GROUP BY department 
                ORDER BY count DESC;
            """)
            departments = cur.fetchall()

            # Course breakdown
            cur.execute("""
                SELECT course, COUNT(*) AS count 
                FROM students 
                GROUP BY course 
                ORDER BY count DESC 
                LIMIT 5;
            """)
            courses = cur.fetchall()

            # Gender breakdown
            cur.execute("""
                SELECT gender, COUNT(*) AS count 
                FROM students 
                GROUP BY gender;
            """)
            genders = cur.fetchall()

            # Recently enrolled students (last 5)
            cur.execute("""
                SELECT * FROM students 
                ORDER BY created_at DESC 
                LIMIT 5;
            """)
            recent_students = [serialize_row(r) for r in cur.fetchall()]

        conn.close()
        return jsonify({
            "success": True,
            "data": {
                "total_students": total_students,
                "departments": departments,
                "total_departments": len(departments),
                "courses": courses,
                "genders": genders,
                "recent_students": recent_students
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to fetch stats: {str(e)}"}), 500


@app.route("/api/students", methods=["GET"])
def get_students():
    """
    Retrieve all students with optional search, filtering, and pagination.
    Query parameters:
      - search: string (matches student_id, full_name, or email)
      - department: string
      - course: string
      - gender: string
      - page: int (default 1)
      - limit: int (default 10, 0 for all)
      - sort_by: string (default 'created_at')
      - order: 'asc' or 'desc' (default 'desc')
    """
    try:
        search = request.args.get("search", "").strip()
        department = request.args.get("department", "").strip()
        course = request.args.get("course", "").strip()
        gender = request.args.get("gender", "").strip()
        page = max(1, int(request.args.get("page", 1)))
        limit = max(0, int(request.args.get("limit", 10)))
        sort_by = request.args.get("sort_by", "created_at").strip()
        order = request.args.get("order", "desc").lower()

        allowed_sorts = {
            "id": "id",
            "student_id": "student_id",
            "full_name": "full_name",
            "email": "email",
            "course": "course",
            "department": "department",
            "enrollment_date": "enrollment_date",
            "created_at": "created_at"
        }
        order_col = allowed_sorts.get(sort_by, "created_at")
        order_dir = "ASC" if order == "asc" else "DESC"

        where_clauses = []
        params = {}

        if search:
            where_clauses.append("(student_id LIKE %(search)s OR full_name LIKE %(search)s OR email LIKE %(search)s OR phone LIKE %(search)s)")
            params["search"] = f"%{search}%"

        if department:
            where_clauses.append("department = %(department)s")
            params["department"] = department

        if course:
            where_clauses.append("course = %(course)s")
            params["course"] = course

        if gender:
            where_clauses.append("gender = %(gender)s")
            params["gender"] = gender

        where_sql = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""

        conn = get_db_connection()
        with conn.cursor() as cur:
            # Count total matching records
            count_query = f"SELECT COUNT(*) AS total FROM students{where_sql};"
            cur.execute(count_query, params)
            total_records = cur.fetchone()["total"]

            # Query data with pagination
            if limit > 0:
                offset = (page - 1) * limit
                data_query = f"""
                    SELECT * FROM students 
                    {where_sql} 
                    ORDER BY {order_col} {order_dir} 
                    LIMIT %(limit)s OFFSET %(offset)s;
                """
                params["limit"] = limit
                params["offset"] = offset
            else:
                data_query = f"SELECT * FROM students {where_sql} ORDER BY {order_col} {order_dir};"

            cur.execute(data_query, params)
            rows = cur.fetchall()

        conn.close()

        total_pages = (total_records + limit - 1) // limit if limit > 0 else 1

        return jsonify({
            "success": True,
            "data": [serialize_row(r) for r in rows],
            "pagination": {
                "total": total_records,
                "page": page,
                "limit": limit,
                "total_pages": total_pages,
                "has_prev": page > 1,
                "has_next": page < total_pages
            }
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Error retrieving students: {str(e)}"}), 500


@app.route("/api/students/<int:id>", methods=["GET"])
def get_student(id):
    """Retrieve details for a single student by primary key ID."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM students WHERE id = %(id)s;", {"id": id})
            student = cur.fetchone()
        conn.close()

        if not student:
            return jsonify({"success": False, "message": f"Student with ID {id} not found."}), 404

        return jsonify({"success": True, "data": serialize_row(student)}), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Error fetching student: {str(e)}"}), 500


@app.route("/api/students", methods=["POST"])
def add_student():
    """Add a new student record to the database."""
    try:
        data = request.get_json() or {}
        errors = validate_student_data(data)
        if errors:
            return jsonify({"success": False, "errors": errors, "message": "Validation failed."}), 400

        conn = get_db_connection()
        with conn.cursor() as cur:
            # Check for duplicate student_id
            cur.execute("SELECT id FROM students WHERE student_id = %(student_id)s;", {"student_id": data["student_id"]})
            if cur.fetchone():
                conn.close()
                return jsonify({"success": False, "message": f"Student ID '{data['student_id']}' already exists."}), 409

            # Check for duplicate email
            cur.execute("SELECT id FROM students WHERE email = %(email)s;", {"email": data["email"]})
            if cur.fetchone():
                conn.close()
                return jsonify({"success": False, "message": f"Email '{data['email']}' is already registered."}), 409

            sql = """
                INSERT INTO students (
                    student_id, full_name, email, phone, date_of_birth,
                    gender, course, department, address, enrollment_date
                ) VALUES (
                    %(student_id)s, %(full_name)s, %(email)s, %(phone)s, %(date_of_birth)s,
                    %(gender)s, %(course)s, %(department)s, %(address)s, %(enrollment_date)s
                );
            """
            cur.execute(sql, data)
            new_id = cur.lastrowid

            # Fetch the newly created record
            cur.execute("SELECT * FROM students WHERE id = %(id)s;", {"id": new_id})
            created_student = cur.fetchone()

        conn.close()

        return jsonify({
            "success": True,
            "message": "Student created successfully!",
            "data": serialize_row(created_student)
        }), 201

    except pymysql.err.IntegrityError as e:
        return jsonify({"success": False, "message": f"Integrity error: Duplicate key or constraint violation ({str(e)})"}), 409
    except Exception as e:
        return jsonify({"success": False, "message": f"Server error while adding student: {str(e)}"}), 500


@app.route("/api/students/<int:id>", methods=["PUT"])
def update_student(id):
    """Update an existing student record."""
    try:
        data = request.get_json() or {}
        errors = validate_student_data(data, is_update=True)
        if errors:
            return jsonify({"success": False, "errors": errors, "message": "Validation failed."}), 400

        conn = get_db_connection()
        with conn.cursor() as cur:
            # Verify student exists
            cur.execute("SELECT id FROM students WHERE id = %(id)s;", {"id": id})
            if not cur.fetchone():
                conn.close()
                return jsonify({"success": False, "message": f"Student with ID {id} not found."}), 404

            # Check for unique student_id among other records
            cur.execute("SELECT id FROM students WHERE student_id = %(student_id)s AND id != %(id)s;", {
                "student_id": data["student_id"],
                "id": id
            })
            if cur.fetchone():
                conn.close()
                return jsonify({"success": False, "message": f"Student ID '{data['student_id']}' is used by another student."}), 409

            # Check for unique email among other records
            cur.execute("SELECT id FROM students WHERE email = %(email)s AND id != %(id)s;", {
                "email": data["email"],
                "id": id
            })
            if cur.fetchone():
                conn.close()
                return jsonify({"success": False, "message": f"Email '{data['email']}' is already used by another student."}), 409

            sql = """
                UPDATE students SET
                    student_id = %(student_id)s,
                    full_name = %(full_name)s,
                    email = %(email)s,
                    phone = %(phone)s,
                    date_of_birth = %(date_of_birth)s,
                    gender = %(gender)s,
                    course = %(course)s,
                    department = %(department)s,
                    address = %(address)s,
                    enrollment_date = %(enrollment_date)s
                WHERE id = %(id)s;
            """
            data["id"] = id
            cur.execute(sql, data)

            # Fetch updated student
            cur.execute("SELECT * FROM students WHERE id = %(id)s;", {"id": id})
            updated_student = cur.fetchone()

        conn.close()

        return jsonify({
            "success": True,
            "message": "Student record updated successfully!",
            "data": serialize_row(updated_student)
        }), 200

    except pymysql.err.IntegrityError as e:
        return jsonify({"success": False, "message": f"Integrity error: {str(e)}"}), 409
    except Exception as e:
        return jsonify({"success": False, "message": f"Server error while updating student: {str(e)}"}), 500


@app.route("/api/students/<int:id>", methods=["DELETE"])
def delete_student(id):
    """Delete a student record from the database."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            # Check if student exists
            cur.execute("SELECT id, student_id, full_name FROM students WHERE id = %(id)s;", {"id": id})
            student = cur.fetchone()
            if not student:
                conn.close()
                return jsonify({"success": False, "message": f"Student with ID {id} not found."}), 404

            cur.execute("DELETE FROM students WHERE id = %(id)s;", {"id": id})

        conn.close()

        return jsonify({
            "success": True,
            "message": f"Student '{student['full_name']}' ({student['student_id']}) deleted successfully."
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Error deleting student: {str(e)}"}), 500


@app.route("/api/departments", methods=["GET"])
def get_departments_and_courses():
    """Retrieve distinct list of departments and courses for forms and dropdowns."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT DISTINCT department FROM students WHERE department IS NOT NULL AND department != '' ORDER BY department;")
            departments = [r["department"] for r in cur.fetchall()]
            cur.execute("SELECT DISTINCT course FROM students WHERE course IS NOT NULL AND course != '' ORDER BY course;")
            courses = [r["course"] for r in cur.fetchall()]
        conn.close()
        return jsonify({
            "success": True,
            "departments": departments,
            "courses": courses
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == "__main__":
    init_database()
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "t")
    print(f" * Student Management System running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
