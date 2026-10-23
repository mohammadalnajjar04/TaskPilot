# TaskPilot Backend

<!-- TODO: Finalize after frontend integration begins. -->

## Overview

TaskPilot REST API. Node.js + Express backend for the TaskPilot task management application.

## Tech Stack

- Node.js, Express
- PostgreSQL (node-postgres / `pg`)
- JWT authentication (jsonwebtoken + bcrypt)
- express-validator, express-rate-limit, helmet, cors, morgan
- Multer for task attachment uploads
- Swagger (swagger-jsdoc + swagger-ui-express)

## Features

- User registration / login / profile
- Projects with owners and project members (roles: owner, manager, member, viewer)
- Task categories
- Tasks with status / urgency / agile columns, filters, and activity logging
- Task comments and file attachments
- Notifications (unread count / mark read)
- Dashboard statistics
- Interactive API docs at `/api/docs`

## Setup

<!-- TODO: Replace with verified step-by-step instructions. -->

1. Install dependencies: `npm install`
2. Configure environment variables (see below).
3. Create the PostgreSQL database and apply the schema.
4. Start the server: `npm start` (or `npm run dev` for auto-reload).

## Environment Variables

See `.env.example` for all required variables.

<!-- TODO: List each variable and its purpose once integration is finalized. -->

## API Documentation

Interactive Swagger UI is available at `GET /api/docs` (JSON at `/api/docs.json`).

## Testing

- Run the full suite: `npm test` (Jest, `--runInBand`)
- Watch mode: `npm run test:watch`
- Syntax-check all source files: `npm run check`

## Project Structure

<!-- TODO: Document the final structure after frontend integration. -->

```
src/
  app.js
  server.js
  config/     # env, database, swagger
  controllers/
  docs/       # Swagger definitions
  middleware/
  repositories/
  routes/
  services/
  utils/
  validators/
tests/
uploads/      # task attachments (see .gitkeep)
```

## Status

Backend feature-complete and audited. <!-- TODO: Update as frontend integration proceeds. -->
