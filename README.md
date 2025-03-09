# Task Management System Backend

A backend system for task management built with Node.js, Express, TypeScript, and TypeORM.

## Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- PostgreSQL database

## Tech Stack

- Node.js & Express
- TypeScript
- TypeORM
- PostgreSQL
- JWT Authentication
- CORS enabled for frontend

## Installation

1. Clone the repository
```bash
git clone https://github.com/Shubham071122/taskmanagementsys-backend
cd taskmanagementsys-backend
```

2. Install dependencies
```bash
npm install
```

3. Environment Setup
Create a `.env` file in the root directory with the following variables:
```env
PORT=5000
PGHOST=###################
PGDATABASE=neondb
PGUSER=neondb_owner
PGPASSWORD=#############
PGPORT=5432
SSL=true
JWT_SECRET=############################
JWT_REFRESH_SECRET=#################################
NODE_ENV=development
#or production if it deployed

PG-URI="##########################"

ACCESS_TOKEN_EXPIRY=##
REFRESH_TOKEN_EXPIRY=##

FRONTEND_URL=http://localhost:3000
```

## Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- POST `/api/users/register` - Register new user
- POST `/api/users/login` - Login user

### Tasks
- GET `/api/tasks` - Get all tasks
- POST `/api/tasks` - Create new task
- PUT `/api/tasks/:id` - Update task
- DELETE `/api/tasks/:id` - Delete task

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000` (Frontend development server)

## Database Configuration

This project uses PostgreSQL with TypeORM. Make sure to:
1. Have Neon PostgreSQL
2. Create a database
3. Update the database connection details in `.env`

## Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with hot-reload




