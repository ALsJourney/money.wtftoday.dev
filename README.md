# Simple Finance - Self-Hosted Finance Dashboard

A comprehensive finance dashboard for small business owners to track income and expenses. This application helps you
manage your financial records, upload invoices, and generate the mighty report for the "Einnahmen-Ausgaben Rechnung".

## Features

- **Income Tracking**: Record and manage income with invoice date, customer, description, payment date, and file uploads
- **Expense Tracking**: Record and manage expenses with invoice date, vendor, description, payment date, and file
  uploads
- **Dashboard**: View yearly summaries and monthly breakdowns of income and expenses
- **File Uploads**: Upload invoice PDFs, images, or Word documents for both income and expenses
- **Tax Reports**: Generate and download tax reports with all attachments
- **Authentication**: Secure user authentication system

## Tech Stack

### Backend

- **Framework**: [Hono.js](https://hono.dev/) - A small, simple, and ultrafast web framework
- **Runtime**: [Bun](https://bun.sh/) - A fast JavaScript runtime, bundler, and package manager
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: better-auth
- **PDF Generation**: jspdf

### Frontend

- **Framework**: [Next.js 15](https://nextjs.org/) with React 19
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [DaisyUI](https://daisyui.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)

## Prerequisites

- [Bun](https://bun.sh/) (v1.0.0 or higher)
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v14.0 or higher)
- [Yarn](https://yarnpkg.com/) (for frontend package management)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/simple_finance.git
cd simple_finance
```

### 2. Set up environment variables

The backend and the frontend each have an `.env`. Please copy the `.env.template` to `.env` file with your
configuration.

### 3. Run the database

Inside `/backend/docker` you will find the Postgres docker compose file.

Simply run it with:

```bash
# inside /docker
docker compose up -d
```

### 4. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# create the uploads folder for the files

mkdir uploads

# Install dependencies
bun install

# Create a .env file and fill out the fields
cp .env.example .env

# Run the backend
bun dev

# Run migrations in a new terminal

bun drizzle-kit push
```

### 4. Frontend setup

```bash

cd finance_frontend

# Install dependencies
bun install

# Run the frontend
bun dev
```

## Usage

1. Register a new account or log in with your credentials
2. Use the dashboard to view your financial summary
3. Add income and expenses with optional file attachments
4. Generate tax reports when needed

## Future Plans

Creating a one click installation setup for Coolify and UmbrelOS.

## Contributing

Since this is a side project and I am a junior dev, contributions are welcome! You are free to request features and
report bugs as an issue right here on the GitHub page.

Expect to find bugs.

Cheers, AL
