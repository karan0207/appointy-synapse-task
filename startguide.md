# Quick Start Guide

## Setup

1. Start Docker services:
```bash
docker compose up -d
```

2. Set up environment variables:
```bash
# Copy .env.example to .env and update values
cp .env.example .env
```

3. Run database migrations:
```bash
npm run db:migrate
```

4. Start development server:
```bash
npm run dev 
```

## Database Migrations

### Run migrations:
```bash
npm run db:migrate
```

### Create new migration:
```bash
cd server
npx prisma migrate dev --name your_migration_name
```

### Reset database (⚠️ deletes all data):
```bash
cd server
npx prisma migrate reset
```

### View database:
```bash
npm run db:studio
```

## Deployment

### Build for production:
```bash
npm run build
```

### Production environment variables:
Update `.env` with production values:
- `NODE_ENV=production`
- `SESSION_SECRET=<strong-random-secret>`
- `DATABASE_URL=<production-database-url>`
- `REDIS_HOST=<production-redis-host>`
- `CLIENT_URL=<production-frontend-url>`

### Run production server:
```bash
# Server
cd server
npm start

# Worker (in separate terminal/process)
cd worker
npm start
```



## Login Credentials

On frontend:
- You can either signup new account or
- Use this for login:
  - email: testuser@gmail.com
  - password: 12345678