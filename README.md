# Polymarket Backend API

A simple Express API built with TypeScript.

## Setup

1. Install dependencies:
```bash
yarn install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
NODE_ENV=development
```

## Development

Start the development server with hot reloading:
```bash
yarn dev
```

## Build and Run

Build the TypeScript code:
```bash
yarn build
```

Run the compiled code:
```bash
yarn start
```

## API Endpoints

### Health Check
- `GET /api/health` - Check API health status

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get a specific user
- `POST /api/users` - Create a new user

## Project Structure

```
src/
├── config/       # Configuration files
├── controllers/  # Route controllers
├── middleware/   # Custom middleware
├── routes/       # API routes
└── index.ts      # Entry point
``` # polymarket-backend
