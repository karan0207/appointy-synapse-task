# Project Synapse

A personal second brain that actually works. Save notes, links, and images, then find them later using natural language search. No more digging through folders or trying to remember exact keywords.

## What it does

Save anything - text notes, web links, images. The app automatically:
- Summarizes and categorizes your content
- Makes it searchable by meaning (not just keywords)
- Shows everything in a clean grid view

Search works like you'd expect: type "cooking tips" and it finds recipes even if they don't have those exact words. Upload a photo and search for what's in it later.

## Quick start

You'll need Node.js 18+ and Docker Desktop.

```bash
# Clone and install
git clone <your-repo-url>
cd secondbrain
npm install

# Start databases
docker compose up -d

# Set up environment
cp .env.example .env
# Edit .env and add your OpenAI API key (optional but recommended)

# Set up database
npm run db:migrate

# Start everything
npm run dev
```

Open `http://localhost:5173` and create an account.

**Ports:**
- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- LocalAI (optional): `http://localhost:8080`

## Tech stack

**Frontend:** React + TypeScript + Tailwind, built with Vite

**Backend:** Express.js API with PostgreSQL (Prisma) and Redis

**AI:** OpenAI API for summaries, embeddings, and image descriptions. Optional LocalAI support for self-hosted models.

**Background jobs:** BullMQ handles async processing (OCR, AI analysis, etc.)

## How it works

1. You add content through the web interface
2. Server saves it and queues a background job
3. Worker processes it: AI summarizes, classifies, generates embeddings
4. You search using natural language - it finds stuff by meaning using vector similarity

## Project structure

```
secondbrain/
├── client/          # React frontend
├── server/          # Express API
├── worker/          # Background job processor
├── shared/          # Shared TypeScript types
└── docker-compose.yml
```

## Environment setup

Create a `.env` file in the root:

```env
DATABASE_URL="postgresql://synapse:synapse_dev_password@localhost:5432/synapse_db"
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3001
SESSION_SECRET=dev-secret-change-in-production
CLIENT_URL=http://localhost:5173

# Optional - for AI features
OPENAI_API_KEY=sk-your-key-here
```

The default database credentials match what's in `docker-compose.yml`. Change them if you want.

## AI setup

**OpenAI (recommended):** Get a key from OpenAI and add it to `.env`. This enables summaries, classification, embeddings, and image descriptions.

**LocalAI (free alternative):** Already in docker-compose. Set `OPENAI_API_BASE=http://localhost:8080/v1` in `.env` and download models. Slower but free.

**No AI:** Works without it, but you lose summaries, classification, and semantic search (keyword search still works).

## Common commands

- `npm run dev` - Start everything
- `npm run dev:client` - Just frontend
- `npm run dev:server` - Just API
- `npm run dev:worker` - Just worker
- `npm run build` - Production build
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Troubleshooting

**Database won't connect?**
- Make sure Docker is running: `docker ps`
- Check the database URL in `.env` matches docker-compose.yml

**Worker not processing?**
- Make sure it's running: `npm run dev:worker`
- Check Redis connection
- Verify OpenAI API key is set (if using AI)

**Items stuck in "PENDING"?**
- Worker needs to be running
- Check worker logs for errors

**Search not working?**
- Items need to be processed first (check worker logs)
- Worker must be running to create embeddings

## Notes

- Vector database is in-memory, so embeddings are lost on server restart. 
- Files are stored locally in `server/uploads/` by default.
- Sessions persist in Redis across restarts.

For more details, check `startguide.md` and `systemdesign.md`.
