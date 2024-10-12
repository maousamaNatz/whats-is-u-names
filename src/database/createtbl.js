const db = require("./connection");

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

  const createAiTokensTable = `
    CREATE TABLE IF NOT EXISTS ai_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      ai_model VARCHAR(50) NOT NULL,
      tokens_left INT NOT NULL DEFAULT 12,
      last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE KEY user_model (user_id, ai_model)
    );
  `;
  const createGrpsTable = `
    CREATE TABLE IF NOT EXISTS Grps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name_group VARCHAR(255) NOT NULL,
      id_group VARCHAR(255) NOT NULL UNIQUE,
      status ENUM('active', 'nonactive') DEFAULT 'nonactive',
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  const createLinksTable = `
    CREATE TABLE IF NOT EXISTS links (
      id INT AUTO_INCREMENT PRIMARY KEY,
      link VARCHAR(255) NOT NULL,
      id_grps INT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_grps) REFERENCES Grps(id)
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

  db.query(createAiTokensTable, (err) => {
    if (err) {
      console.error("Error creating ai_tokens table:", err);
    } else {
      console.log("ai_tokens table created or already exists");
    }
  });

  db.query(createGrpsTable, (err) => {
    if (err) {
      console.error("Error creating Grps table:", err);
    } else {
      console.log("Grps table created or already exists");
    }
  });
  db.query(createLinksTable, (err) => {
    if (err) {
      console.error("Error creating links table:", err);
    } else {
      console.log("Links table created or already exists");
    }
  });
};

module.exports = { createTables };
