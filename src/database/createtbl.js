const db = require('./database');

const createTables = () => {
  const createRolesTable = `
          CREATE TABLE IF NOT EXISTS roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL
          );
        `;

  const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          phone VARCHAR(255) NOT NULL,
          role_id INT,
          lifetime DATETIME,
          FOREIGN KEY (role_id) REFERENCES roles(id)
        );
      `;

  const createBotsTable = `
    CREATE TABLE IF NOT EXISTS bots (
      id INT AUTO_INCREMENT PRIMARY KEY,
      phone_number VARCHAR(20) NOT NULL,
      session_path VARCHAR(255) NOT NULL,
      lifetime INT NOT NULL DEFAULT 30,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expired_at TIMESTAMP GENERATED ALWAYS AS (created_at + INTERVAL lifetime DAY) STORED,
      UNIQUE(phone_number)
    );
  `;

  db.query(createRolesTable, (err) => {
    if (err) {
      console.error("Error creating roles table:", err);
    } else {
      console.log("Roles table created or already exists.");
    }
  });

  db.query(createUsersTable, (err) => {
    if (err) {
      console.error("Error creating users table:", err);
    } else {
      console.log("Users table created or already exists.");
    }
  });

  db.query(createBotsTable, (err) => {
    if (err) {
      console.error("Error creating bots table:", err);
    } else {
      console.log("Bots table created or already exists.");
    }
  });
};

module.exports = { createTables };