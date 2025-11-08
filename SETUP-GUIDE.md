# 🚀 Quick Setup Guide - Project Synapse

## Prerequisites Checklist

- ✅ Node.js >= 18.0.0
- ✅ npm >= 9.0.0
- ✅ Docker and Docker Compose
- ✅ Git

## Step-by-Step Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd project-synapse

# Install all dependencies
npm install
```

This installs dependencies for all workspaces (client, server, worker, shared).

### 2. Start Docker Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify services are running
docker ps
# You should see: synapse-postgres and synapse-redis
```

### 3. Create Environment Files

**Create `server/.env`:**
```bash
DATABASE_URL="postgresql://synapse:synapse_dev_password@localhost:5432/synapse_db"
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3001
NODE_ENV=development
SESSION_SECRET=change-this-to-a-random-string-in-production
CLIENT_URL=http://localhost:5173

# Optional - for AI features
# OPENAI_API_KEY=sk-your-key-here
```

**Create `worker/.env`:**
```bash
DATABASE_URL="postgresql://synapse:synapse_dev_password@localhost:5432/synapse_db"
REDIS_HOST=localhost
REDIS_PORT=6379
API_URL=http://localhost:3001

# Optional - for AI features
# OPENAI_API_KEY=sk-your-key-here
```

**Create `client/.env`:**
```bash
# No configuration needed for development
# Vite proxy handles API routing
```

### 4. Setup Database

```bash
# Navigate to server directory
cd server

# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Return to root
cd ..
```

### 5. Start All Services

Open **3 terminal windows** and run:

**Terminal 1 - Backend API:**
```bash
npm run dev:server
```
Wait for: `🚀 Server running on http://localhost:3001`

**Terminal 2 - Worker:**
```bash
npm run dev:worker
```
Wait for: `Worker is running...`

**Terminal 3 - Frontend:**
```bash
npm run dev:client
```
Wait for: `Local: http://localhost:5173`

### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

You should see the login/signup page!

## First Steps

1. **Sign Up**
   - Click "Sign up"
   - Enter email, password (min 8 chars), and optional name
   - You'll be automatically logged in

2. **Add Your First Item**
   - Click "+ Add Item" button
   - Try the Text tab: Type "Test note" and press Cmd/Ctrl+Enter
   - Wait a few seconds for AI processing (if OpenAI configured)

3. **Test Features**
   - Add a link: Try `https://github.com`
   - Upload a file: Drag & drop an image
   - Use search: Type "test" in the search bar

## Troubleshooting

### Port Already in Use

**If port 3001 is busy:**
```bash
# Change PORT in server/.env
PORT=3002
```

**If port 5173 is busy:**
```bash
# Vite will automatically use next available port
```

### Database Connection Error

```bash
# Check Docker services
docker ps

# Restart if needed
docker-compose restart postgres

# Check DATABASE_URL in server/.env matches docker-compose.yml
```

### Redis Connection Error

```bash
# Check Redis is running
docker logs synapse-redis

# Restart if needed
docker-compose restart redis
```

### Prisma Client Not Generated

```bash
cd server
npx prisma generate
cd ..
```

### AI Features Not Working

- Check `OPENAI_API_KEY` is set in `server/.env` and `worker/.env`
- Verify the key is valid
- Without OpenAI, basic capture still works, but no AI features

### Module Import Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules
rm -rf client/node_modules server/node_modules worker/node_modules shared/node_modules
npm install
```

## Verifying Setup

### Check Backend Health

```bash
curl http://localhost:3001/health
# Should return: {"success":true,"message":"Server is running",...}
```

### Check Database

```bash
cd server
npx prisma studio
# Opens database browser at http://localhost:5555
```

### Check Logs

**Server logs:** Check Terminal 1
**Worker logs:** Check Terminal 2
**Client logs:** Check Terminal 3 or browser console

## Development Tips

### Hot Reload

All services support hot reload:
- **Frontend**: Instant (Vite HMR)
- **Backend**: Auto-restart (tsx watch mode)
- **Worker**: Auto-restart (tsx watch mode)

### Database Changes

```bash
# Make changes to server/prisma/schema.prisma
# Then create migration:
cd server
npx prisma migrate dev --name your_migration_name
npx prisma generate
cd ..
```

### Stop Everything

```bash
# Stop dev servers: Ctrl+C in each terminal

# Stop Docker services:
docker-compose down

# Stop and remove data (careful!):
docker-compose down -v
```

## Next Steps

Once everything is running:

1. Read `DEMO.md` for feature testing guide
2. Read `DEMO-SEARCH.md` for semantic search guide
3. Check `THINKING-PROCESS.md` for architecture insights
4. See `FINAL-STATUS.md` for complete feature list

## Quick Command Reference

```bash
# Install
npm install

# Start Docker
docker-compose up -d

# Setup DB
cd server && npx prisma migrate dev && cd ..

# Run all services (3 terminals)
npm run dev:server
npm run dev:worker
npm run dev:client

# Stop Docker
docker-compose down

# View logs
docker logs synapse-postgres
docker logs synapse-redis
```

## Getting Help

- Check terminal logs for errors
- Read error messages carefully
- Verify all .env files are created
- Ensure Docker services are running
- Check ports aren't already in use

---

**Ready to build your second brain! 🧠✨**

