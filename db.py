import os
import pymysql
from pymysql.cursors import DictCursor
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "Root@12345")
DB_NAME = os.getenv("DB_NAME", "student_management")


def get_db_connection(use_database=True):
    """
    Establish a connection to the MySQL server.
    Returns a PyMySQL connection object configured with DictCursor.
    """
    try:
        kwargs = {
            "host": DB_HOST,
            "port": DB_PORT,
            "user": DB_USER,
            "password": DB_PASSWORD,
            "charset": "utf8mb4",
            "cursorclass": DictCursor,
            "autocommit": True,
            "connect_timeout": 10
        }
        if use_database:
            kwargs["database"] = DB_NAME
            
        connection = pymysql.connect(**kwargs)
        return connection
    except pymysql.MySQLError as e:
        print(f"[Database Connection Error] {e}")
        raise e


def init_database():
    """
    Ensure the student_management database and students table exist.
    Supports both local development and hosted/cloud MySQL providers.
    """
    try:
        # Step 1: Attempt to create database if permitted (works on local MySQL root)
        try:
            conn_admin = get_db_connection(use_database=False)
            with conn_admin.cursor() as cur:
                cur.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            conn_admin.close()
        except Exception:
            # On managed cloud databases (Railway, TiDB, PythonAnywhere), the database is pre-allocated
            pass

        # Step 2: Connect to the target database and ensure table schema exists
        conn = get_db_connection(use_database=True)
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS students (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id VARCHAR(50) NOT NULL UNIQUE,
                    full_name VARCHAR(150) NOT NULL,
                    email VARCHAR(150) NOT NULL UNIQUE,
                    phone VARCHAR(30) NOT NULL,
                    date_of_birth DATE NOT NULL,
                    gender VARCHAR(20) NOT NULL,
                    course VARCHAR(100) NOT NULL,
                    department VARCHAR(100) NOT NULL,
                    address TEXT NOT NULL,
                    enrollment_date DATE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_student_id (student_id),
                    INDEX idx_email (email),
                    INDEX idx_department (department),
                    INDEX idx_course (course)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)
        conn.close()
        print(f"[DB] Initialized database '{DB_NAME}' and table 'students' successfully.")
        return True
    except Exception as e:
        print(f"[DB Error] Failed to initialize database: {e}")
        return False
