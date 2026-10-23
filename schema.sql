-- Database Initialization for Student Management System
CREATE DATABASE IF NOT EXISTS student_management 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE student_management;

-- Students Table Definition
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

-- Sample Seed Data
INSERT INTO students (student_id, full_name, email, phone, date_of_birth, gender, course, department, address, enrollment_date)
VALUES 
('STU-2024-001', 'Aarav Sharma', 'aarav.sharma@example.edu', '+91 98765 43210', '2003-05-14', 'Male', 'Computer Science & Engineering', 'Computer Science', '42 MG Road, Sector 14, Bengaluru, Karnataka', '2024-08-01'),
('STU-2024-002', 'Ananya Iyer', 'ananya.iyer@example.edu', '+91 98123 45678', '2003-09-22', 'Female', 'Data Science & AI', 'Computer Science', '18 Indiranagar 100ft Rd, Bengaluru, Karnataka', '2024-08-01'),
('STU-2024-003', 'Rohan Verma', 'rohan.verma@example.edu', '+91 97234 56789', '2002-11-10', 'Male', 'Mechanical Engineering', 'Engineering & Technology', '75 Civil Lines, Jaipur, Rajasthan', '2024-08-05'),
('STU-2024-004', 'Priya Patel', 'priya.patel@example.edu', '+91 96345 67890', '2004-01-18', 'Female', 'Business Administration (BBA)', 'Management & Business', '120 Ring Road, Surat, Gujarat', '2024-08-10'),
('STU-2024-005', 'Vikram Malhotra', 'vikram.m@example.edu', '+91 95456 78901', '2002-07-30', 'Male', 'Electrical & Electronics', 'Engineering & Technology', '88 Park Street, Kolkata, West Bengal', '2024-08-12'),
('STU-2024-006', 'Sneha Kulkarni', 'sneha.k@example.edu', '+91 94567 89012', '2003-03-25', 'Female', 'Biotechnology', 'Natural Sciences', '15 FC Road, Shivaji Nagar, Pune, Maharashtra', '2024-08-15'),
('STU-2024-007', 'Kabir Sen', 'kabir.sen@example.edu', '+91 93678 90123', '2003-12-05', 'Male', 'Cyber Security', 'Computer Science', '204 South Extension II, New Delhi', '2024-08-18'),
('STU-2024-008', 'Diya Nambiar', 'diya.n@example.edu', '+91 92789 01234', '2004-04-12', 'Female', 'Information Technology', 'Computer Science', '33 Marine Drive, Kochi, Kerala', '2024-08-20')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);
