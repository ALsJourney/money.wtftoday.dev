# Kleinunternehmer Finance Dashboard

A simple dashboard for small business owners in Austria to track income and expenses.

## Features

- **Income Tracking**: Record and manage income with invoice date, customer, description, payment date, and file uploads
- **Expense Tracking**: Record and manage expenses with invoice date, vendor, description, payment date, and file uploads
- **Dashboard**: View yearly summaries and monthly breakdowns of income and expenses
- **File Uploads**: Upload invoice PDFs, images, or Word documents for both income and expenses
- **Authentication**: Secure user authentication system

## Tech Stack

- **Backend**: Hono.js with Context7
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: better-auth

## API Endpoints

### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login with email and password
- `GET /api/auth/logout`: Logout the current user
- `GET /api/auth/providers`: List available authentication providers

### Income

- `POST /api/income`: Create a new income record
- `GET /api/income`: Get all income records (with optional year filter)
- `GET /api/income/:id`: Get a specific income record
- `PUT /api/income/:id`: Update an income record
- `DELETE /api/income/:id`: Delete an income record

### Expenses

- `POST /api/expense`: Create a new expense record
- `GET /api/expense`: Get all expense records (with optional year filter)
- `GET /api/expense/:id`: Get a specific expense record
- `PUT /api/expense/:id`: Update an expense record
- `DELETE /api/expense/:id`: Delete an expense record

### Dashboard

- `GET /api/dashboard/summary/:year`: Get yearly summary (total income, total expenses, net income)
- `GET /api/dashboard/monthly/:year`: Get monthly breakdown for a specific year
- `GET /api/dashboard/recent`: Get recent transactions (both income and expenses)

### File Upload

- `POST /api/upload`: Upload a file (PDF, image, or Word document)
- `GET /api/files/:userId/:fileName`: Serve an uploaded file

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   bun install
   ```
3. Create a `.env` file with the following variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/finance_db
   BETTER_AUTH_SECRET=your-secret-key
   BETTER_AUTH_URL=http://localhost:8558
   ALLOWED_ORIGINS=http://localhost:3000
   UPLOAD_DIR=./uploads
   APP_PORT=8558
   APP_HOST=localhost
   ```
4. Run database migrations:
   ```
   bunx drizzle-kit push
   ```
5. Start the development server:
   ```
   bun run dev
   ```

## Database Schema

### Income Table

- `id`: UUID primary key
- `userId`: Reference to user table
- `invoiceDate`: Date of the invoice
- `customer`: Name of the customer
- `description`: Description of the income
- `paymentDate`: Date when payment was received (optional)
- `amount`: Amount in cents
- `fileUrl`: URL to the uploaded file (optional)
- `fileName`: Name of the uploaded file (optional)
- `fileType`: Type of the uploaded file (optional)
- `createdAt`: Timestamp when the record was created
- `updatedAt`: Timestamp when the record was last updated

### Expense Table

- `id`: UUID primary key
- `userId`: Reference to user table
- `invoiceDate`: Date of the invoice
- `vendor`: Name of the vendor
- `description`: Description of the expense
- `paymentDate`: Date when payment was made (optional)
- `amount`: Amount in cents
- `fileUrl`: URL to the uploaded file (optional)
- `fileName`: Name of the uploaded file (optional)
- `fileType`: Type of the uploaded file (optional)
- `createdAt`: Timestamp when the record was created
- `updatedAt`: Timestamp when the record was last updated
