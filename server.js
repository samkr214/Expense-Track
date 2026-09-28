const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const db = require("./database");

dotenv.config();

const app = express();


// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());


// ===============================
// JWT AUTHENTICATION MIDDLEWARE
// ===============================

function authenticateToken(req, res, next) {

    const authHeader = req.headers["authorization"];

    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Authentication token required"
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {

        if (err) {
            return res.status(403).json({
                message: "Invalid or expired token"
            });
        }

        req.user = user;

        next();
    });
}


// ===============================
// HOME ROUTE
// ===============================

app.get("/", (req, res) => {

    res.json({
        message: "ExpenseTrack API is running"
    });

});


// ===============================
// REGISTER
// ===============================

app.post("/register", async (req, res) => {

    try {

        const { name, email, password } = req.body;

        // Basic validation
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }


        // Check if user already exists
        db.get(
            "SELECT id FROM users WHERE email = ?",
            [email],
            async (err, user) => {

                if (err) {
                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                if (user) {
                    return res.status(400).json({
                        message: "Email already registered"
                    });
                }


                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);


                // Insert user
                db.run(
                    `INSERT INTO users (name, email, password)
                     VALUES (?, ?, ?)`,
                    [name, email, hashedPassword],
                    function (err) {

                        if (err) {
                            return res.status(500).json({
                                message: "Failed to create user"
                            });
                        }

                        res.status(201).json({
                            message: "User registered successfully",
                            userId: this.lastID
                        });

                    }
                );

            }
        );

    } catch (error) {

        res.status(500).json({
            message: "Server error"
        });

    }

});


// ===============================
// LOGIN
// ===============================

app.post("/login", (req, res) => {

    const { email, password } = req.body;


    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }


    db.get(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, user) => {

            if (err) {
                return res.status(500).json({
                    message: "Database error"
                });
            }


            if (!user) {
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }


            const passwordMatch = await bcrypt.compare(
                password,
                user.password
            );


            if (!passwordMatch) {
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }


            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "1h"
                }
            );


            res.status(200).json({
                message: "Login successful",
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            });

        }
    );

});

// ===============================
// CREATE CATEGORY
// ===============================

app.post("/categories", authenticateToken, (req, res) => {

    console.log("CATEGORY BODY:", req.body);
    const { name } = req.body;

    if (!name || name.trim() === "") {
        return res.status(400).json({
            message: "Category name is required"
        });
    }

    db.run(
        `INSERT INTO categories (name, userId)
         VALUES (?, ?)`,
        [name.trim(), req.user.id],
        function (err) {

            if (err) {
                return res.status(500).json({
                    message: "Failed to create category"
                });
            }

            res.status(201).json({
                message: "Category created successfully",
                category: {
                    id: this.lastID,
                    name: name.trim(),
                    userId: req.user.id
                }
            });
        }
    );
});

// ===============================
// GET ALL CATEGORIES
// ===============================

app.get("/categories", authenticateToken, (req, res) => {

    db.all(
        `SELECT * FROM categories
         WHERE userId = ?
         ORDER BY id DESC`,
        [req.user.id],
        (err, categories) => {

            if (err) {
                return res.status(500).json({
                    message: "Failed to fetch categories"
                });
            }

            res.status(200).json(categories);
        }
    );
});

// ===============================
// GET SINGLE CATEGORY
// ===============================

app.get("/categories/:id", authenticateToken, (req, res) => {

    db.get(
        `SELECT * FROM categories
         WHERE id = ? AND userId = ?`,
        [req.params.id, req.user.id],
        (err, category) => {

            if (err) {
                return res.status(500).json({
                    message: "Failed to fetch category"
                });
            }

            if (!category) {
                return res.status(404).json({
                    message: "Category not found"
                });
            }

            res.status(200).json(category);
        }
    );
});

// ===============================
// UPDATE CATEGORY
// ===============================

app.put("/categories/:id", authenticateToken, (req, res) => {

    const { name } = req.body;

    if (!name || name.trim() === "") {
        return res.status(400).json({
            message: "Category name is required"
        });
    }

    db.run(
        `UPDATE categories
         SET name = ?
         WHERE id = ? AND userId = ?`,
        [name.trim(), req.params.id, req.user.id],
        function (err) {

            if (err) {
                return res.status(500).json({
                    message: "Failed to update category"
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    message: "Category not found"
                });
            }

            res.status(200).json({
                message: "Category updated successfully"
            });
        }
    );
});

// ===============================
// DELETE CATEGORY
// ===============================

app.delete("/categories/:id", authenticateToken, (req, res) => {

    db.run(
        `DELETE FROM categories
         WHERE id = ? AND userId = ?`,
        [req.params.id, req.user.id],
        function (err) {

            if (err) {
                return res.status(500).json({
                    message: "Failed to delete category"
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    message: "Category not found"
                });
            }

            res.status(200).json({
                message: "Category deleted successfully"
            });
        }
    );
});

// ===============================
// CREATE EXPENSE
// ===============================

app.post("/expenses", authenticateToken, (req, res) => {

    const {
        title,
        amount,
        categoryId,
        date,
        description
    } = req.body;

    // Basic validation
    if (!title || amount === undefined || !categoryId || !date) {
        return res.status(400).json({
            message: "Title, amount, categoryId and date are required"
        });
    }

    if (Number(amount) <= 0) {
        return res.status(400).json({
            message: "Amount must be greater than 0"
        });
    }

    // Check category belongs to logged-in user
    db.get(
        `SELECT id FROM categories
         WHERE id = ? AND userId = ?`,
        [categoryId, req.user.id],
        (err, category) => {

            if (err) {
                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (!category) {
                return res.status(404).json({
                    message: "Category not found"
                });
            }

            // Insert expense
            db.run(
                `INSERT INTO expenses
                (title, amount, categoryId, date, description, userId)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    title.trim(),
                    Number(amount),
                    categoryId,
                    date,
                    description || "",
                    req.user.id
                ],
                function (err) {

                    if (err) {
                        return res.status(500).json({
                            message: "Failed to create expense"
                        });
                    }

                    res.status(201).json({
                        message: "Expense created successfully",
                        expense: {
                            id: this.lastID,
                            title: title.trim(),
                            amount: Number(amount),
                            categoryId,
                            date,
                            description: description || "",
                            userId: req.user.id
                        }
                    });

                }
            );
        }
    );
});

// ===============================
// GET ALL EXPENSES
// ===============================

app.get("/expenses", authenticateToken, (req, res) => {

    db.all(
        `SELECT 
            expenses.id,
            expenses.title,
            expenses.amount,
            expenses.categoryId,
            categories.name AS categoryName,
            expenses.date,
            expenses.description
         FROM expenses
         JOIN categories
         ON expenses.categoryId = categories.id
         WHERE expenses.userId = ?
         ORDER BY expenses.date DESC, expenses.id DESC`,
        [req.user.id],
        (err, expenses) => {

            if (err) {
                return res.status(500).json({
                    message: "Failed to fetch expenses"
                });
            }

            res.status(200).json(expenses);
        }
    );
});
// ===============================
// GET SINGLE EXPENSE
// ===============================

app.get("/expenses/:id", authenticateToken, (req, res) => {

    db.get(
        `SELECT 
            expenses.id,
            expenses.title,
            expenses.amount,
            expenses.categoryId,
            categories.name AS categoryName,
            expenses.date,
            expenses.description
         FROM expenses
         JOIN categories
         ON expenses.categoryId = categories.id
         WHERE expenses.id = ?
         AND expenses.userId = ?`,
        [req.params.id, req.user.id],
        (err, expense) => {

            if (err) {
                return res.status(500).json({
                    message: "Failed to fetch expense"
                });
            }

            if (!expense) {
                return res.status(404).json({
                    message: "Expense not found"
                });
            }

            res.status(200).json(expense);
        }
    );
});
// ===============================
// UPDATE EXPENSE
// ===============================

app.put("/expenses/:id", authenticateToken, (req, res) => {

    const {
        title,
        amount,
        categoryId,
        date,
        description
    } = req.body;

    if (!title || amount === undefined || !categoryId || !date) {
        return res.status(400).json({
            message: "Title, amount, categoryId and date are required"
        });
    }

    if (Number(amount) <= 0) {
        return res.status(400).json({
            message: "Amount must be greater than 0"
        });
    }

    // Check category belongs to user
    db.get(
        `SELECT id FROM categories
         WHERE id = ? AND userId = ?`,
        [categoryId, req.user.id],
        (err, category) => {

            if (err) {
                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (!category) {
                return res.status(404).json({
                    message: "Category not found"
                });
            }

            db.run(
                `UPDATE expenses
                 SET title = ?,
                     amount = ?,
                     categoryId = ?,
                     date = ?,
                     description = ?
                 WHERE id = ?
                 AND userId = ?`,
                [
                    title.trim(),
                    Number(amount),
                    categoryId,
                    date,
                    description || "",
                    req.params.id,
                    req.user.id
                ],
                function (err) {

                    if (err) {
                        return res.status(500).json({
                            message: "Failed to update expense"
                        });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({
                            message: "Expense not found"
                        });
                    }

                    res.status(200).json({
                        message: "Expense updated successfully"
                    });

                }
            );
        }
    );
});

// ===============================
// DELETE EXPENSE
// ===============================

app.delete("/expenses/:id", authenticateToken, (req, res) => {

    db.run(
        `DELETE FROM expenses
         WHERE id = ?
         AND userId = ?`,
        [req.params.id, req.user.id],
        function (err) {

            if (err) {
                return res.status(500).json({
                    message: "Failed to delete expense"
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    message: "Expense not found"
                });
            }

            res.status(200).json({
                message: "Expense deleted successfully"
            });

        }
    );
});
// ===============================
// SERVER
// ===============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {

    console.log(`ExpenseTrack API running on port ${PORT}`);

});