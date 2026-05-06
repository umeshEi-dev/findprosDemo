# FindPros Category / Task App

Full-stack category and task management app.

## Stack

- Frontend: Angular 21 with standalone components, reactive forms, and `HttpClient`
- Backend: Node.js, Express, Mongoose
- Database: MongoDB

Angular 21.x is the current active Angular major per the official Angular release schedule, and this workspace is already using `@angular/*` 21.x.

## Project Structure

```text
frontend/
  src/app/core/              Shared models and API service
  src/app/features/          Category UI components
  src/environments/          API URL config

backend/
  src/config/                Mongo connection
  src/controllers/           Request handlers
  src/models/                Mongoose schemas
  src/routes/                REST routes
  src/middleware/            Error handling
```

## Backend Setup

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Default API URL: `http://localhost:5000/api`

Make sure MongoDB is running locally, or update `MONGO_URI` in `backend/.env`.

## Frontend Setup

```bash
cd frontend
npm install
npm start
```

Default frontend URL: `http://localhost:4200`

The frontend API URL is configured in:

```text
frontend/src/environments/environment.ts
frontend/src/environments/environment.development.ts
```

## API Endpoints

- `POST /api/categories` creates a category
- `GET /api/categories` returns categories with task counts and embedded task data
- `POST /api/tasks` creates a task linked to a category
- `GET /api/tasks` returns tasks with populated category data

## UI Flow

- Category list page shows category rows, nested task rows, price columns, action icons, loading/error states, and an Add Category / Task button.
- Add Category / Task opens the screenshot-style full-page modal state with Category and Task radio options.
- Task form fetches categories from the API for the dropdown and saves task prices for Lead, Call, and Appointment.
- Filter button opens a modal for category name and task type filtering.
