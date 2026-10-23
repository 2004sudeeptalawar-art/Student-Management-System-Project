"""
Database initialization and seeding script for Student Management System
"""
import pymysql
from db import get_db_connection, init_database, DB_NAME

SAMPLE_STUDENTS = [
    {
        "student_id": "STU-2024-001",
        "full_name": "Aarav Sharma",
        "email": "aarav.sharma@example.edu",
        "phone": "+91 98765 43210",
        "date_of_birth": "2003-05-14",
        "gender": "Male",
        "course": "Computer Science & Engineering",
        "department": "Computer Science",
        "address": "42 MG Road, Sector 14, Bengaluru, Karnataka",
        "enrollment_date": "2024-08-01"
    },
    {
        "student_id": "STU-2024-002",
        "full_name": "Ananya Iyer",
        "email": "ananya.iyer@example.edu",
        "phone": "+91 98123 45678",
        "date_of_birth": "2003-09-22",
        "gender": "Female",
        "course": "Data Science & AI",
        "department": "Computer Science",
        "address": "18 Indiranagar 100ft Rd, Bengaluru, Karnataka",
        "enrollment_date": "2024-08-01"
    },
    {
        "student_id": "STU-2024-003",
        "full_name": "Rohan Verma",
        "email": "rohan.verma@example.edu",
        "phone": "+91 97234 56789",
        "date_of_birth": "2002-11-10",
        "gender": "Male",
        "course": "Mechanical Engineering",
        "department": "Engineering & Technology",
        "address": "75 Civil Lines, Jaipur, Rajasthan",
        "enrollment_date": "2024-08-05"
    },
    {
        "student_id": "STU-2024-004",
        "full_name": "Priya Patel",
        "email": "priya.patel@example.edu",
        "phone": "+91 96345 67890",
        "date_of_birth": "2004-01-18",
        "gender": "Female",
        "course": "Business Administration (BBA)",
        "department": "Management & Business",
        "address": "120 Ring Road, Surat, Gujarat",
        "enrollment_date": "2024-08-10"
    },
    {
        "student_id": "STU-2024-005",
        "full_name": "Vikram Malhotra",
        "email": "vikram.m@example.edu",
        "phone": "+91 95456 78901",
        "date_of_birth": "2002-07-30",
        "gender": "Male",
        "course": "Electrical & Electronics",
        "department": "Engineering & Technology",
        "address": "88 Park Street, Kolkata, West Bengal",
        "enrollment_date": "2024-08-12"
    },
    {
        "student_id": "STU-2024-006",
        "full_name": "Sneha Kulkarni",
        "email": "sneha.k@example.edu",
        "phone": "+91 94567 89012",
        "date_of_birth": "2003-03-25",
        "gender": "Female",
        "course": "Biotechnology",
        "department": "Natural Sciences",
        "address": "15 FC Road, Shivaji Nagar, Pune, Maharashtra",
        "enrollment_date": "2024-08-15"
    },
    {
        "student_id": "STU-2024-007",
        "full_name": "Kabir Sen",
        "email": "kabir.sen@example.edu",
        "phone": "+91 93678 90123",
        "date_of_birth": "2003-12-05",
        "gender": "Male",
        "course": "Cyber Security",
        "department": "Computer Science",
        "address": "204 South Extension II, New Delhi",
        "enrollment_date": "2024-08-18"
    },
    {
        "student_id": "STU-2024-008",
        "full_name": "Diya Nambiar",
        "email": "diya.n@example.edu",
        "phone": "+91 92789 01234",
        "date_of_birth": "2004-04-12",
        "gender": "Female",
        "course": "Information Technology",
        "department": "Computer Science",
        "address": "33 Marine Drive, Kochi, Kerala",
        "enrollment_date": "2024-08-20"
    }
]


def seed_database():
    """Seed the database with sample students if table is empty or update existing."""
    init_database()
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS total FROM students;")
            res = cur.fetchone()
            total = res["total"] if res else 0
            
            if total == 0:
                print("[Seeder] Seeding initial student records...")
                sql = """
                    INSERT INTO students (
                        student_id, full_name, email, phone, date_of_birth,
                        gender, course, department, address, enrollment_date
                    ) VALUES (
                        %(student_id)s, %(full_name)s, %(email)s, %(phone)s, %(date_of_birth)s,
                        %(gender)s, %(course)s, %(department)s, %(address)s, %(enrollment_date)s
                    )
                """
                for s in SAMPLE_STUDENTS:
                    cur.execute(sql, s)
                print(f"[Seeder] Seeded {len(SAMPLE_STUDENTS)} records successfully.")
            else:
                print(f"[Seeder] Table 'students' already has {total} records. Skipping seed.")
    finally:
        conn.close()


if __name__ == "__main__":
    seed_database()
