# Personal Dashboard API Server

Express.js backend with SQLite database for the Personal Dashboard application.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3)
- **Language**: TypeScript
- **CORS**: Enabled for development

## Project Structure

```
server/
├── src/
│   ├── db/
│   │   ├── index.ts          # Database connection & migrations
│   │   └── schema.sql        # Database schema
│   ├── routes/
│   │   ├── notes.ts          # Notes CRUD endpoints
│   │   ├── tasks.ts          # Tasks CRUD endpoints
│   │   ├── links.ts          # Links CRUD endpoints
│   │   └── pomodoro.ts       # Pomodoro session tracking
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   ├── utils/
│   │   ├── errors.ts         # Custom error classes
│   │   └── validate.ts       # Input validation helpers
│   └── index.ts              # Main Express app
├── data/                     # SQLite database file (auto-created)
├── dist/                     # Compiled JavaScript (build output)
├── package.json
├── tsconfig.json
└── nodemon.json
```

## Installation

```bash
cd server
npm install
```

## Available Scripts

### Development
```bash
npm run dev
```
Starts the server in development mode with hot-reload using nodemon.

### Production Build
```bash
npm run build
```
Compiles TypeScript to JavaScript in the `dist/` directory.

### Start Production Server
```bash
npm start
```
Runs the compiled server from `dist/`.

### Clean Build Files
```bash
npm run clean
```
Removes the `dist/` directory.

## Environment Variables

- `PORT` - Server port (default: 3001)
- `CLIENT_URL` - CORS origin (default: http://localhost:5173)
- `NODE_ENV` - Environment mode (development/production)

Example:
```bash
PORT=3001 npm start
```

## API Endpoints

### Health Check
- `GET /api/health` - Server status check

### Notes
- `GET /api/notes` - List all notes
- `GET /api/notes/:id` - Get single note
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Tasks
- `GET /api/tasks` - List all tasks (optional ?status=active|completed)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Quick Links
- `GET /api/links` - List all links (ordered by position)
- `POST /api/links` - Create link
- `PUT /api/links/:id` - Update link
- `PUT /api/links/reorder` - Reorder links
- `DELETE /api/links/:id` - Delete link

### Pomodoro
- `POST /api/pomodoro/session` - Log completed session
- `GET /api/pomodoro/stats` - Get session statistics

## API Response Format

### Success Response
```json
{
  "data": { ... },
  "success": true
}
```

### Error Response
```json
{
  "error": "Error message",
  "success": false
}
```

## Database

The SQLite database is automatically created on first run in `server/data/dashboard.db`.

### Tables

- **notes** - Note storage with timestamps
- **tasks** - Task management with priority and due dates
- **links** - Quick links with custom ordering
- **pomodoro_sessions** - Session tracking for statistics

Database migrations run automatically on server startup.

## Development

The server uses:
- TypeScript strict mode for type safety
- Express middleware for CORS and JSON parsing
- better-sqlite3 for synchronous database operations
- Custom error handling with consistent API responses
- Input validation for all endpoints

## Testing the API

### Using curl

```bash
# Health check
curl http://localhost:3001/api/health

# Create a note
curl -X POST http://localhost:3001/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"My Note","content":"Note content"}'

# Get all tasks
curl http://localhost:3001/api/tasks

# Create a task
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy groceries","priority":"high","due_date":"2025-12-26"}'

# Update task (toggle complete)
curl -X PUT http://localhost:3001/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'
```

## Port Configuration

By default, the server runs on port 3001. To use a different port:

```bash
PORT=3002 npm run dev
```
