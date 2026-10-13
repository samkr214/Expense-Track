const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db", (err) => {
    if (err) {
        console.log("Database connection error:", err.message);
    } else {
        console.log("Database connected successfully");
    }
});


// Enable foreign key support
db.run("PRAGMA foreign_keys = ON");

function addColumnIfNotExists(columnName, columnDefinition) {
    db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) {
            console.log("Could not check users table:", err.message);
            return;
        }

        const exists = columns.some(
            (column) => column.name === columnName
        );

        if (!exists) {
            db.run(
                `ALTER TABLE users ADD COLUMN ${columnName} ${columnDefinition}`,
                (err) => {
                    if (err) {
                        console.log(
                            `Error adding ${columnName}:`,
                            err.message
                        );
                    } else {
                        console.log(`${columnName} column added`);
                    }
                }
            );
        }
    });
}


// ===============================
// USERS TABLE
// ===============================
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
`, (err) => {
    if (err) {
        console.log("Users table creation error:", err.message);
    } else {
        console.log("Users table ready");
    }
});

addColumnIfNotExists("isVerified", "INTEGER NOT NULL DEFAULT 1");
addColumnIfNotExists("verificationToken", "TEXT");
addColumnIfNotExists("verificationTokenExpires", "INTEGER");
addColumnIfNotExists("resetToken", "TEXT");
addColumnIfNotExists("resetTokenExpires", "INTEGER");


// ===============================
// CATEGORIES TABLE
// ===============================
db.run(`
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        userId INTEGER NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
`, (err) => {
    if (err) {
        console.log("Categories table creation error:", err.message);
    } else {
        console.log("Categories table ready");
    }
});


// ===============================
// EXPENSES TABLE
// ===============================
db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        categoryId INTEGER NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        userId INTEGER NOT NULL,

        FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
`, (err) => {
    if (err) {
        console.log("Expenses table creation error:", err.message);
    } else {
        console.log("Expenses table ready");
    }
});


module.exports = db;