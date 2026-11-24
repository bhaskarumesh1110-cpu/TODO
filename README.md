# Cadence — Smart Todo List CRUD Application

A full-stack Smart Todo List web application built with React, TypeScript, Tailwind CSS, Node.js, Express.js, and MySQL (`todo_db` schema included).

## Folder Structure

```text
├── database/
│   └── todo_db.sql          # MySQL database and table creation script
├── server/
│   ├── db.ts                # MySQL (mysql2) pool + local JSON persistence fallback
│   └── validation.ts        # Server-side input validation & sanitization
├── src/
│   ├── api/tasks.ts         # REST API client functions
│   ├── components/          # Modular UI components (Sidebar, Dashboard, TaskCard, Modals)
│   ├── types/task.ts        # Shared TypeScript models & constants
│   ├── App.tsx              # Main application workspace
│   ├── index.css            # Tailwind CSS v4 & light/dark theme configuration
│   └── main.tsx             # React entry point
├── server.ts                # Express REST API server & Vite integration
├── index.html               # HTML entry point
└── package.json             # Dependencies & scripts
```

## Database Setup (MySQL)

1. Run the SQL script in your MySQL server to create the `todo_db` database and `tasks` table:

```bash
mysql -u root -p < database/todo_db.sql
```

2. Configure your `.env` file (based on `.env.example`):

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=todo_db
```

> If `MYSQL_HOST` is omitted, the Express server automatically persists tasks locally in `data/tasks.json` so all CRUD operations remain functional out of the box.

## Running Locally

```bash
# Install dependencies
npm install

# Start development server (Express + Vite on port 3000)
npm run dev

# Build for production
npm run build

# Start production server
NODE_ENV=production npm start
```

## REST API Endpoints

- `GET /api/tasks` — List all tasks (supports `status`, `priority`, `category`, `search`, `sort` query parameters)
- `GET /api/tasks/:id` — Retrieve a single task by ID
- `POST /api/tasks` — Create a new task
- `PUT /api/tasks/:id` — Replace all fields of an existing task
- `PATCH /api/tasks/:id` — Partially update a task (e.g., toggle status, priority, or due date)
- `DELETE /api/tasks/:id` — Delete a task
