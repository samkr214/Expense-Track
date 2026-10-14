
jest.mock("./database", () => ({
  get: jest.fn(),
  all: jest.fn(),
  run: jest.fn()
}));

const request = require("supertest");
const db = require("./database");
const jwt = require("jsonwebtoken");
const app = require("./server");

const createTestToken = () =>
  jwt.sign(
    { id: 1, email: "test@example.com" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

beforeEach(() => {
  jest.clearAllMocks();

  db.get.mockImplementation((sql, params, callback) => {
    callback(null, null);
  });
});




// const request = require("supertest");
// const app = require("./server");

describe("ExpenseTrack API", () => {
  test("GET / should return API running message", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      message: "ExpenseTrack API is running"
    });
  });

  test("POST /register should reject missing email", async () => {
    const response = await request(app)
      .post("/register")
      .send({
        name: "Test User",
        password: "password123"
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Name, email and password are required"
    );
  });

  test("POST /register should reject short password", async () => {
    const response = await request(app)
      .post("/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "123"
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Password must be at least 6 characters"
    );
  });

  test("GET /verify-email should reject missing token", async () => {
    const response = await request(app)
      .get("/verify-email");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Verification token is required"
    );
  });
  
  test("GET /expenses should reject requests without token", async () => {
    const response = await request(app).get("/expenses");

    expect(response.statusCode).toBe(401);
  });

  test("POST /login should reject missing credentials", async () => {
    const response = await request(app)
      .post("/login")
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Email and password are required"
    );
  });

  test("POST /login should reject unknown email", async () => {
    const response = await request(app)
      .post("/login")
      .send({
        email: "unknown@example.com",
        password: "password123"
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe(
      "Invalid email or password"
    );
  });

  test("POST /forgot-password should reject missing email", async () => {
    const response = await request(app)
      .post("/forgot-password")
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Email is required"
    );
  });

  test("POST /reset-password should reject missing fields", async () => {
    const response = await request(app)
      .post("/reset-password")
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Token and new password are required"
    );
  });

  test("POST /reset-password should reject short password", async () => {
    const response = await request(app)
      .post("/reset-password")
      .send({
        token: "fake-token",
        newPassword: "123"
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Password must be at least 6 characters"
    );
  });

  test("POST /login should succeed with valid credentials", async () => {
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("password123", 10);

    db.get.mockImplementationOnce((sql, params, callback) => {
      callback(null, {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
        isVerified: 1
      });
    });

    const response = await request(app)
      .post("/login")
      .send({
        email: "test@example.com",
        password: "password123"
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe("test@example.com");
  });

  test("POST /login should reject incorrect password", async () => {
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("password123", 10);

    db.get.mockImplementationOnce((sql, params, callback) => {
      callback(null, {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
        isVerified: 1
      });
    });

    const response = await request(app)
      .post("/login")
      .send({
        email: "test@example.com",
        password: "wrongpass"
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe(
      "Invalid email or password"
    );
  });

  test("POST /login should reject unverified account", async () => {
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("password123", 10);

    db.get.mockImplementationOnce((sql, params, callback) => {
      callback(null, {
        id: 2,
        name: "Unverified User",
        email: "unverified@example.com",
        password: hashedPassword,
        isVerified: 0
      });
    });

    const response = await request(app)
      .post("/login")
      .send({
        email: "unverified@example.com",
        password: "password123"
      });

    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe(
      "Please verify your email before logging in"
    );
  });

  test("POST /reset-password should reject invalid token", async () => {
    const response = await request(app)
      .post("/reset-password")
      .send({
        token: "invalid-token",
        newPassword: "newpass123"
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Invalid reset token"
    );
    
const createTestToken = () =>
  jwt.sign(
    { id: 1, email: "test@example.com" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  });

  test("POST /categories should reject missing category name", async () => {
    const token = createTestToken();

    const response = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Category name is required"
    );
  });

  test("POST /categories should create a category successfully", async () => {
    db.run.mockImplementationOnce(function (sql, params, callback) {
      this.lastID = 10;
      callback.call(this, null);
    });

    const token = createTestToken();

    const response = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Food" });

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe(
      "Category created successfully"
    );
    expect(response.body.category).toEqual({
      id: 10,
      name: "Food",
      userId: 1
    });
  });

  test("GET /categories should return categories successfully", async () => {
    db.all.mockImplementationOnce((sql, params, callback) => {
      callback(null, [
        { id: 2, name: "Travel", userId: 1 },
        { id: 1, name: "Food", userId: 1 }
      ]);
    });

    const token = createTestToken();

    const response = await request(app)
      .get("/categories")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([
      { id: 2, name: "Travel", userId: 1 },
      { id: 1, name: "Food", userId: 1 }
    ]);
  });

  test("GET /categories/:id should return a category", async () => {
    db.get.mockImplementationOnce((sql, params, callback) => {
      callback(null, {
        id: 5,
        name: "Food",
        userId: 1
      });
    });

    const token = createTestToken();

    const response = await request(app)
      .get("/categories/5")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      id: 5,
      name: "Food",
      userId: 1
    });
  });

  test("GET /categories/:id should return 404 when category is missing", async () => {
    db.get.mockImplementationOnce((sql, params, callback) => {
      callback(null, null);
    });

    const token = createTestToken();

    const response = await request(app)
      .get("/categories/999")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Category not found");
  });

  test("GET /categories/:id should return 404 when category is not found", async () => {
    db.get.mockImplementationOnce((sql, params, callback) => {
      callback(null, null);
    });

    const token = createTestToken();

    const response = await request(app)
      .get("/categories/999")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Category not found");
  });

  test("PUT /categories/:id should update category successfully", async () => {
    db.run.mockImplementationOnce(function (sql, params, callback) {
      this.changes = 1;
      callback.call(this, null);
    });

    const token = createTestToken();

    const response = await request(app)
      .put("/categories/5")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Food" });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe(
      "Category updated successfully"
    );
  });

  test("PUT /categories/:id should return 404 when category is not found", async () => {
    db.run.mockImplementationOnce(function (sql, params, callback) {
      this.changes = 0;
      callback.call(this, null);
    });

    const token = createTestToken();

    const response = await request(app)
      .put("/categories/999")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Missing Category" });

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Category not found");
  });

  test("DELETE /categories/:id should delete category successfully", async () => {
    db.run.mockImplementationOnce(function (sql, params, callback) {
      this.changes = 1;
      callback.call(this, null);
    });

    const token = createTestToken();

    const response = await request(app)
      .delete("/categories/5")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe(
      "Category deleted successfully"
    );
  });

  test("DELETE /categories/:id should return 404 when category is not found", async () => {
    db.run.mockImplementationOnce(function (sql, params, callback) {
      this.changes = 0;
      callback.call(this, null);
    });

    const token = createTestToken();

    const response = await request(app)
      .delete("/categories/999")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Category not found");
  });

  test("POST /expenses should reject missing required fields", async () => {
    const token = createTestToken();

    const response = await request(app)
      .post("/expenses")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Title, amount, categoryId and date are required"
    );
  });

  test("POST /expenses should reject zero amount", async () => {
    const token = createTestToken();

    const response = await request(app)
      .post("/expenses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Lunch",
        amount: 0,
        categoryId: 1,
        date: "2026-10-14",
        description: "Lunch expense"
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Amount must be greater than 0"
    );
  });

  test("POST /expenses should create expense successfully", async () => {
    db.get.mockImplementationOnce((sql, params, callback) => {
      callback(null, { id: 1 });
    });

    db.run.mockImplementationOnce(function (sql, params, callback) {
      this.lastID = 25;
      callback.call(this, null);
    });

    const token = createTestToken();

    const response = await request(app)
      .post("/expenses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Lunch",
        amount: 150,
        categoryId: 1,
        date: "2026-10-14",
        description: "Lunch expense"
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe(
      "Expense created successfully"
    );
    expect(response.body.expense).toEqual({
      id: 25,
      title: "Lunch",
      amount: 150,
      categoryId: 1,
      date: "2026-10-14",
      description: "Lunch expense",
      userId: 1
    });
  });

  test("GET /expenses should return expenses successfully", async () => {
    db.all.mockImplementationOnce((sql, params, callback) => {
      callback(null, [
        {
          id: 2,
          title: "Travel",
          amount: 200,
          categoryId: 1,
          categoryName: "Transport",
          date: "2026-10-14",
          description: "Bus fare"
        },
        {
          id: 1,
          title: "Lunch",
          amount: 150,
          categoryId: 2,
          categoryName: "Food",
          date: "2026-10-13",
          description: "Lunch expense"
        }
      ]);
    });

    const token = createTestToken();

    const response = await request(app)
      .get("/expenses")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].title).toBe("Travel");
    expect(response.body[1].title).toBe("Lunch");
  });

  test("GET /expenses/:id should return a single expense", async () => {
    db.get.mockImplementationOnce((sql, params, callback) => {
      callback(null, {
        id: 5,
        title: "Lunch",
        amount: 150,
        categoryId: 1,
        categoryName: "Food",
        date: "2026-10-14",
        description: "Lunch expense"
      });
    });

    const token = createTestToken();

    const response = await request(app)
      .get("/expenses/5")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      id: 5,
      title: "Lunch",
      amount: 150,
      categoryId: 1,
      categoryName: "Food",
      date: "2026-10-14",
      description: "Lunch expense"
    });
  });

  test("GET /expenses/:id should return 404 when expense is not found", async () => {
    db.get.mockImplementationOnce((sql, params, callback) => {
      callback(null, null);
    });

    const token = createTestToken();

    const response = await request(app)
      .get("/expenses/999")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Expense not found");
  });

  test("PUT /expenses/:id should update expense successfully", async () => {
    db.get.mockImplementationOnce((sql, params, callback) => {
      callback(null, { id: 1 });
    });

    db.run.mockImplementationOnce(function (sql, params, callback) {
      this.changes = 1;
      callback.call(this, null);
    });

    const token = createTestToken();

    const response = await request(app)
      .put("/expenses/5")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Updated Lunch",
        amount: 180,
        categoryId: 1,
        date: "2026-10-14",
        description: "Updated expense"
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe(
      "Expense updated successfully"
    );
  });

  test("PUT /expenses/:id should return 404 when expense is not found", async () => {
    db.get.mockImplementationOnce((sql, params, callback) => {
      callback(null, { id: 1 });
    });

    db.run.mockImplementationOnce(function (sql, params, callback) {
      this.changes = 0;
      callback.call(this, null);
    });

    const token = createTestToken();

    const response = await request(app)
      .put("/expenses/999")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Updated Lunch",
        amount: 180,
        categoryId: 1,
        date: "2026-10-14",
        description: "Updated expense"
      });

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Expense not found");
  });

  test("DELETE /expenses/:id should delete expense successfully", async () => {
    db.run.mockImplementationOnce(function (sql, params, callback) {
      this.changes = 1;
      callback.call(this, null);
    });

    const token = createTestToken();

    const response = await request(app)
      .delete("/expenses/5")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe(
      "Expense deleted successfully"
    );
  });

  test("DELETE /expenses/:id should return 404 when expense is not found", async () => {
    db.run.mockImplementationOnce(function (sql, params, callback) {
      this.changes = 0;
      callback.call(this, null);
    });

    const token = createTestToken();

    const response = await request(app)
      .delete("/expenses/999")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Expense not found");
  });

  test("POST /register should return 400 when email already exists", async () => {
    db.get.mockImplementationOnce((sql, params, callback) => {
      callback(null, { id: 1 });
    });

    const response = await request(app)
      .post("/register")
      .send({
        name: "Test User",
        email: "existing@example.com",
        password: "password123"
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Email already registered");
  });

  test("POST /register should handle database error", async () => {
    db.get.mockImplementationOnce((sql, params, callback) => {
      callback(new Error("Database failure"), null);
    });

    const response = await request(app)
      .post("/register")
      .send({
        name: "Test User",
        email: "newuser@example.com",
        password: "password123"
      });

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe("Database error");
  });

test("POST /register should register a new user successfully", async () => {
  db.get.mockImplementationOnce((sql, params, callback) => {
    callback(null, null);
  });

  db.run.mockImplementationOnce(function (sql, params, callback) {
    this.lastID = 101;
    callback.call(this, null);
  });

  const response = await request(app)
    .post("/register")
    .send({
      name: "Test User",
      email: "newuser@example.com",
      password: "password123"
    });

  expect(response.statusCode).toBe(201);
  expect(response.body.message).toBe(
    "Registration successful. Verify your email."
  );
  expect(response.body.userId).toBe(101);
});

test("GET /verify-email should verify email successfully", async () => {
  db.get.mockImplementationOnce((sql, params, callback) => {
    callback(null, {
      id: 1,
      verificationTokenExpires: Date.now() + 60000
    });
  });

  db.run.mockImplementationOnce(function (sql, params, callback) {
    callback.call(this, null);
  });

  const response = await request(app)
    .get("/verify-email")
    .query({ token: "valid-test-token" });

  expect(response.statusCode).toBe(200);
  expect(response.body.message).toBe("Email verified successfully");
});

test("GET /verify-email should handle database error", async () => {
  db.get.mockImplementationOnce((sql, params, callback) => {
    callback(new Error("Database failure"), null);
  });

  const response = await request(app)
    .get("/verify-email")
    .query({ token: "valid-test-token" });

  expect(response.statusCode).toBe(500);
  expect(response.body.message).toBe("Database error");
});

test("POST /forgot-password should generate reset token successfully", async () => {
  db.get.mockImplementationOnce((sql, params, callback) => {
    callback(null, {
      id: 1,
      email: "test@example.com"
    });
  });

  db.run.mockImplementationOnce(function (sql, params, callback) {
    callback.call(this, null);
  });

  const response = await request(app)
    .post("/forgot-password")
    .send({
      email: "test@example.com"
    });

  expect(response.statusCode).toBe(200);
  expect(response.body.message).toBe(
    "If the account exists, a reset link has been generated"
  );
});

test("POST /reset-password should reset password successfully", async () => {
  db.get.mockImplementationOnce((sql, params, callback) => {
    callback(null, {
      id: 1,
      resetTokenExpires: Date.now() + 60000
    });
  });

  db.run.mockImplementationOnce(function (sql, params, callback) {
    callback.call(this, null);
  });

  const response = await request(app)
    .post("/reset-password")
    .send({
      token: "valid-reset-token",
      newPassword: "newpassword123"
    });

  expect(response.statusCode).toBe(200);
  expect(response.body.message).toBe("Password reset successful");
});

});
