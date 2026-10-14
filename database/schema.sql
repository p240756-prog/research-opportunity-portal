-- Import this file with a MySQL account allowed to create databases and tables.
-- It is safe to run again: it does not delete existing opportunities.
CREATE DATABASE IF NOT EXISTS research_portal
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE research_portal;

CREATE TABLE IF NOT EXISTS opportunities (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  research_area VARCHAR(100) NOT NULL,
  faculty_name VARCHAR(120) NOT NULL,
  department VARCHAR(120) NOT NULL,
  required_skills VARCHAR(1000) NOT NULL,
  available_positions SMALLINT UNSIGNED NOT NULL,
  application_deadline DATE NOT NULL,
  status ENUM('Open', 'Closed') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT positions_positive CHECK (available_positions BETWEEN 1 AND 1000),
  INDEX idx_status_deadline (status, application_deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
