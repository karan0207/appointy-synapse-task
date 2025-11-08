# Project Synapse

A personal second brain app that helps you capture, organize, and find your stuff using AI. Think of it like a smart notebook that actually understands what you're looking for.

## What This Does

You know how you save links, take notes, and upload images but then can never find them later? This solves that. You can:

- **Save anything**: Text notes, web links, images - just dump it in
- **AI magic happens**: It automatically summarizes things, figures out what type of content it is, and makes it searchable
- **Find stuff naturally**: Search for "cooking tips" and it'll find recipes even if they don't have those exact words. Upload a photo of a monkey and search "monkey" later - it'll find it
- **Nice UI**: Clean grid view of all your stuff with previews

## What We Built This With

Here's the tech stack we used:

**Frontend:**
- React with TypeScript - for the UI
- Tailwind CSS - for styling
- Vite - for fast development

**Backend:**
- Express.js with TypeScript - REST API
- PostgreSQL - main database (using Prisma ORM)
- Redis - for background job queues and sessions
- BullMQ - handles async processing

**AI Stuff:**
- OpenAI API - for summaries, embeddings, and image descriptions
- LocalAI - optional self-hosted alternative (runs in Docker)
- In-memory vector store - for semantic search (can swap to Qdrant/Pinecone later)

**Other:**
- Docker & Docker Compose - for running databases locally
- Tesseract.js - OCR for extracting text from images

## Installation

### What You Need First

- Node.js 18+ and npm 9+
- Docker Desktop (for PostgreSQL and Redis)

### Step 1: Get the Code

```bash
git clone <your-repo-url>
cd secondbrain
npm install
```

This installs everything for all the parts (frontend, backend, worker, shared code).

### Step 2: Start the Databases

We use Docker to run PostgreSQL and Redis locally. Just run:

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- LocalAI on port 8080 (optional, only if you want self-hosted AI)

Wait a few seconds for them to start up. You can check with `docker ps` to see if they're running.

### Step 3: Set Up Environment Variables

Create a single `.env` file in the root directory. Copy the example file:

```bash
cp .env.example .env
```

Then edit `.env` and update the values as needed:

```env
# Database
DATABASE_URL="postgresql://synapse:synapse_dev_password@localhost:5432/synapse_db"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=3001
NODE_ENV=development
SESSION_SECRET=dev-secret-change-in-production
CLIENT_URL=http://localhost:5173

# OpenAI (optional - for AI features)
# Get a key from https://openai.com
OPENAI_API_KEY=sk-your-key-here

# OR if using LocalAI instead (self-hosted):
# OPENAI_API_KEY=not-needed
# OPENAI_API_BASE=http://localhost:8080/v1
```

**Note:** The client doesn't need environment variables as it uses Vite's proxy configuration.

### Step 4: Set Up the Database

Run the migrations to create all the tables:

```bash
npm run db:migrate
```

This creates the users, items, content, media, and embeddings tables in PostgreSQL.

### Step 5: Start Everything

Now start all the services:

```bash
npm run dev
```

This fires up:
- **Frontend** at `http://localhost:5173` - open this in your browser
- **API server** at `http://localhost:3001` - handles requests
- **Worker** - processes items in the background (you won't see this, but it's working)

If you want to run them separately:
```bash
npm run dev:client   # Just the frontend
npm run dev:server   # Just the API
npm run dev:worker   # Just the worker
```

### Step 6: Create an Account

1. Go to `http://localhost:5173`
2. Click "Sign Up" and make an account
3. Start adding stuff!

## How It Works

1. **You add content** - text, links, or images through the web interface
2. **It gets queued** - the server saves it and puts a job in Redis
3. **Worker processes it** - background worker picks up the job, uses AI to summarize/classify, generates embeddings
4. **You search** - type natural language queries, it finds stuff by meaning using vector similarity

## Project Structure

```
secondbrain/
├── client/          # React frontend
│   └── src/
│       ├── components/    # UI components
│       ├── pages/         # Page views
│       ├── hooks/         # React hooks
│       └── context/       # Auth context, etc.
│
├── server/          # Express API
│   └── src/
│       ├── controllers/   # Request handlers
│       ├── routes/         # API endpoints
│       ├── services/       # Business logic (vector DB, etc.)
│       └── config/         # Database, Redis, session setup
│
├── worker/          # Background job processor
│   └── src/
│       ├── jobs/          # Job handlers (process-item.ts)
│       ├── services/      # OpenAI, metadata extraction
│       └── queue/         # BullMQ setup
│
├── shared/          # Shared TypeScript types
│
└── docker-compose.yml    # Docker services
```

## Useful Commands

- `npm run dev` - Start everything
- `npm run build` - Build for production
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio (database GUI - super useful!)
- `npm run lint` - Check code style
- `npm run format` - Auto-format code

## Configuration Options

### Using OpenAI (Recommended)

Get an API key from OpenAI and put it in your `.env` files. This gives you:
- Text summarization
- Content classification
- Embedding generation for search
- Image descriptions

### Using LocalAI (Free, Self-Hosted)

If you don't want to pay for OpenAI, you can use LocalAI. It's already in the docker-compose.yml. Just:
1. Set `OPENAI_API_BASE=http://localhost:8080/v1` in your `.env` files
2. Download models (see the setup scripts in the repo)
3. It'll work the same way, just slower

**Vision Model Fallback**: If LocalAI vision model isn't available, the system will automatically fall back to OpenAI's vision API (if `OPENAI_API_KEY` is set). This means you can:
- Use LocalAI for embeddings (free)
- Use OpenAI for vision descriptions (optional fallback)
- Or use both - LocalAI first, OpenAI as backup

### Running Without AI

The app works without AI, but you lose:
- Automatic summaries
- Content classification
- Semantic search (only keyword search works)

## Troubleshooting

**Database won't connect?**
- Make sure Docker is running: `docker ps`
- Check the database URL matches what's in docker-compose.yml
- Try: `docker-compose logs postgres`

**Redis issues?**
- Check it's running: `docker-compose ps`
- Make sure port 6379 isn't taken by something else

**Worker not processing items?**
- Make sure the worker is running: `npm run dev:worker`
- Check Redis connection in the worker logs
- Verify your OpenAI API key is set (if using AI)

**Search not working?**
- Items need to be processed first (check worker logs)
- Make sure embeddings are being generated
- The worker needs to run to create embeddings

**Items stuck in "PENDING"?**
- The worker needs to be running to process them
- Check worker logs for errors
- Make sure Redis is connected

## Notes

- The vector database is currently in-memory, so embeddings are lost on server restart. For production, you'd want to swap it for Qdrant or Pinecone.
- File uploads are stored locally in `server/uploads/` by default. For production, you'd want to use S3 or similar.
- Sessions are stored in Redis, so they persist across server restarts.

That's it! If something's broken, check the logs and make sure all three services (client, server, worker) are running.
