# ExpenseTrack Backend

ExpenseTrack is a backend application built with Node.js and Express.js for managing expenses and categories. It provides APIs for user registration, login, email verification, password recovery, category management, and expense management.

## Technologies Used

- Node.js
- Express.js
- SQLite
- JSON Web Token (JWT)
- Jest
- Supertest

## Features

- User registration and login
- Email verification
- Forgot password and password reset
- Category creation, retrieval, updating, and deletion
- Expense creation, retrieval, updating, and deletion
- Authentication using JWT
- Automated API testing

## Installation

1. Clone the repository.
2. Open the project folder in the terminal.
3. Install the dependencies:

   `npm install`

4. Configure the required environment variables in a local `.env` file.

5. Start the backend server:

   `npm start`
## Testing

Run all automated tests:

```bash
npm test
```

Generate the code coverage report:

```bash
npm run coverage
```

The automated test suite uses Jest and Supertest to test API endpoints. The latest test run passed **41 tests**, with **83.02% statement coverage**, **83.02% line coverage**, **76.59% branch coverage**, and **97.5% function coverage**.

Coverage results may change when the tests or application code are updated.