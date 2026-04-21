-- MPCPL Optimized Employee Chat Database
-- Updated for: masafipetro_dev

CREATE DATABASE IF NOT EXISTS masafipetro_dev;
USE masafipetro_dev;

-- 1. Employee Profile (Main User Table)
CREATE TABLE IF NOT EXISTS employee_profile (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emp_code VARCHAR(20) UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role TINYINT COMMENT '1-Staff, 2-Incharge, 3-Team Leader, 4-Accountant, 5-Admin',
    salary DECIMAL(10,2),
    address TEXT,
    city VARCHAR(50),
    region VARCHAR(50),
    country VARCHAR(50),
    postbox VARCHAR(20),
    phone VARCHAR(20),
    phonealt VARCHAR(20),
    picture VARCHAR(255),
    sign VARCHAR(255),
    fl_id INT,
    fs_id INT,
    station VARCHAR(100),
    client VARCHAR(100),
    status TINYINT DEFAULT 1 COMMENT '0-Inactive, 1-Active',
    device_token TEXT,
    account_details TEXT,
    qr_code TEXT,
    auth_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Employee Sessions (Chat Session Management)
CREATE TABLE IF NOT EXISTS employee_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL COMMENT 'Employee who initiated the chat',
    responder_id INT NOT NULL COMMENT 'Employee who accepted the chat',
    status ENUM('pending', 'active', 'ended') DEFAULT 'pending',
    request_message TEXT COMMENT 'Initial message when requesting chat',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    FOREIGN KEY (requester_id) REFERENCES employee_profile(id) ON DELETE CASCADE,
    FOREIGN KEY (responder_id) REFERENCES employee_profile(id) ON DELETE CASCADE
);

-- 3. Employee Chat Settings
CREATE TABLE IF NOT EXISTS employee_chat_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    auto_accept BOOLEAN DEFAULT FALSE,
    notification_sound BOOLEAN DEFAULT TRUE,
    notification_desktop BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_profile(id) ON DELETE CASCADE
);

-- 4. Chat Messages (Real-time messages linked to session)
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file') DEFAULT 'text',
    file_path VARCHAR(255),
    status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (session_id) REFERENCES employee_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES employee_profile(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES employee_profile(id) ON DELETE CASCADE
);

-- INITIAL DUMMY DATA
INSERT INTO employee_profile (emp_code, name, email, password, role) VALUES 
('EMP001', 'Admin User', 'umar@gmail.com', '123456', 5),
('EMP002', 'Rahul Sharma', 'rahul@mpcpl.com', '123456', 1),
('EMP003', 'Priya TL', 'priya@mpcpl.com', '123456', 3);
