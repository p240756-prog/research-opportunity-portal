CREATE TABLE IF NOT EXISTS faculty (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    department VARCHAR(150) NOT NULL,
    email VARCHAR(150)
);

CREATE TABLE IF NOT EXISTS opportunities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    area VARCHAR(150) NOT NULL,
    faculty_id INT NOT NULL,
    department VARCHAR(150) NOT NULL,
    required_skills TEXT,
    available_positions INT NOT NULL,
    deadline DATE NOT NULL,
    status ENUM('Open', 'Closed') NOT NULL DEFAULT 'Open',

    CONSTRAINT fk_opportunities_faculty
        FOREIGN KEY (faculty_id)
        REFERENCES faculty(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);