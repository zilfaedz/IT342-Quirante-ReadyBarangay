-- Database Schema for Strict Barangay Management System

-- 0. Clean up existing tables if they were created with wrong types
-- Note: users table is kept since it's shared with Java backend
DROP TABLE IF EXISTS captain_history;
DROP TABLE IF EXISTS barangays;

-- 1. Barangays Table
CREATE TABLE IF NOT EXISTS barangays (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    psgc_code VARCHAR(50) UNIQUE NOT NULL,
    barangay_name VARCHAR(255) NOT NULL,
    city_name VARCHAR(255) NOT NULL,
    city_code VARCHAR(50) NOT NULL,
    province_name VARCHAR(255) NOT NULL,
    province_code VARCHAR(50) NOT NULL,
    region_name VARCHAR(255) NOT NULL,
    region_code VARCHAR(50) NOT NULL,
    captain_id BIGINT UNIQUE DEFAULT NULL, -- UNIQUE ensures only one captain record per barangay
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_psgc (psgc_code)
);

-- 2. Users Table Updates
-- Note: Handled programmatically in initDb.js to check for existence
ALTER TABLE users ADD COLUMN role ENUM('Resident', 'Barangay Captain', 'Admin') DEFAULT 'Resident';
ALTER TABLE users ADD COLUMN barangay_id BIGINT DEFAULT NULL;
ALTER TABLE users ADD COLUMN status ENUM('active', 'suspended') DEFAULT 'active';

-- Add Foreign Key to users
-- Note: This might fail if types don't match, so we ensure barangay_id is BIGINT above.
ALTER TABLE users ADD CONSTRAINT fk_user_barangay FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE SET NULL;

-- 3. Captain History Table
CREATE TABLE IF NOT EXISTS captain_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    barangay_id BIGINT NOT NULL,
    old_captain_id BIGINT,
    new_captain_id BIGINT NOT NULL,
    changed_by BIGINT NOT NULL, -- The Admin who performed the change
    reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (barangay_id) REFERENCES barangays(id),
    FOREIGN KEY (old_captain_id) REFERENCES users(id),
    FOREIGN KEY (new_captain_id) REFERENCES users(id),
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- 4. Initial Constraints & Triggers (Optional but recommended)
-- Ensure captain role alignment
-- For simplicity in Express, we will handle complex cross-table validation in code transactions.
