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
          username VARCHAR(255) NOT NULL,
          phone VARCHAR(255) NOT NULL,
          role_id INT,
          lifetime DATETIME,
          FOREIGN KEY (role_id) REFERENCES roles(id)
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
};
module.exports = { createTables };