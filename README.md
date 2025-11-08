# Project Synapse

**An intelligent second brain for capturing, organizing, and retrieving information.**

Synapse helps you capture text notes, web links, and images, automatically enriches them with AI-powered summaries and classifications, and lets you search through everything using natural language queries. Think of it as your personal knowledge base that understands what you're looking for, not just matching keywords.

## What It Does

### 🎯 Core Features

- **Capture Anything**: Add text notes, save web links, or upload images
- **AI-Powered Processing**: Automatic summarization, content classification, and smart tagging
- **Semantic Search**: Find content by meaning, not just keywords. Ask "cooking tips" and find recipes even if they don't contain those exact words
- **Image Understanding**: Upload images and search for them by what's in them (e.g., "monkey" finds images with monkeys, even without text)
- **Organized View**: Beautiful grid layout showing all your captured items with previews
- **User Management**: Secure authentication, profile management, and password changes

### 🧠 How It Works

1. **Capture**: You add content through a simple interface
2. **Process**: Background worker enriches content with AI (summaries, classifications, embeddings)
3. **Search**: Use natural language to find what you're looking for
4. **Retrieve**: Get relevant results ranked by relevance

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Worker**: BullMQ + Redis for async processing
- **Database**: PostgreSQL with Prisma ORM
- **AI**: OpenAI API (or LocalAI for self-hosted)
- **Search**: Hybrid semantic + keyword search with vector embeddings

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** and **Docker Compose** (for local database and Redis)

### Step 1: Clone and Install

```bash
git clone <repository-url>
cd secondbrain
npm install
```

This installs dependencies for all workspaces (client, server, worker, shared).

### Step 2: Start Infrastructure

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- LocalAI (optional) on `localhost:8080`

### Step 3: Setup Environment Variables

Create `.env` files in each service directory:

**server/.env:**
```env
DATABASE_URL="postgresql://synapse:synapse_dev_password@localhost:5432/synapse_db"
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3001
NODE_ENV=development
SESSION_SECRET=your_random_secret_here_change_in_production
CLIENT_URL=http://localhost:5173

# OpenAI Configuration (choose one)
# Option 1: Use OpenAI API
OPENAI_API_KEY=sk-your-openai-key-here

# Option 2: Use LocalAI (self-hosted, free)
# OPENAI_API_KEY=not-needed
# OPENAI_API_BASE=http://localhost:8080/v1
```

**worker/.env:**
```env
DATABASE_URL="postgresql://synapse:synapse_dev_password@localhost:5432/synapse_db"
REDIS_HOST=localhost
REDIS_PORT=6379
API_URL=http://localhost:3001

# Same OpenAI configuration as server
OPENAI_API_KEY=sk-your-openai-key-here
# or for LocalAI:
# OPENAI_API_KEY=not-needed
# OPENAI_API_BASE=http://localhost:8080/v1
```

**client/.env:**
```env
VITE_API_URL=http://localhost:3001
```

### Step 4: Setup Database

Run database migrations:

```bash
npm run db:migrate
```

This creates all necessary tables in PostgreSQL.

### Step 5: Start Development Servers

Start all services in development mode:

```bash
npm run dev
```

This starts:
- **Client**: `http://localhost:5173` (React frontend)
- **Server**: `http://localhost:3001` (Express API)
- **Worker**: Background job processor

Or start individually:
```bash
npm run dev:client   # Frontend only
npm run dev:server   # API only
npm run dev:worker   # Worker only
```

### Step 6: Create Your First Account

1. Open `http://localhost:5173` in your browser
2. Click "Sign Up" and create an account
3. Start capturing content!

## Project Structure

```
secondbrain/
├── client/          # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── context/       # React context providers
│   └── package.json
│
├── server/          # Express.js API server
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── config/         # Configuration files
│   └── package.json
│
├── worker/          # Background job processor
│   ├── src/
│   │   ├── jobs/          # Job processors
│   │   ├── services/      # Processing services
│   │   └── queue/         # Queue configuration
│   └── package.json
│
├── shared/          # Shared TypeScript types
│   └── package.json
│
├── docker-compose.yml    # Docker services configuration
├── package.json          # Root workspace configuration
└── README.md             # This file
```

## Available Scripts

- `npm run dev` - Start all services in development mode
- `npm run build` - Build all services for production
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run lint` - Lint all code
- `npm run format` - Format all code with Prettier

## Features in Detail

### Content Capture
- **Text Notes**: Quick capture with instant storage
- **Web Links**: Automatic metadata extraction (title, description, images)
- **File Uploads**: Drag-and-drop interface for images and documents

### AI Processing
- **Summarization**: GPT-3.5 generates concise summaries
- **Classification**: Automatic content type detection
- **Embeddings**: Vector representations for semantic search
- **Vision**: Image descriptions using GPT-4 Vision API

### Search
- **Natural Language**: Ask questions in plain English
- **Semantic Matching**: Finds conceptually similar content
- **Type Filtering**: Automatically detects and filters by content type
- **Hybrid Results**: Combines semantic and keyword search

## Configuration Options

### Using OpenAI API
Set `OPENAI_API_KEY` in your `.env` files. This provides:
- Text summarization
- Content classification
- Embedding generation
- Image descriptions (vision models)

### Using LocalAI (Self-Hosted)
Set `OPENAI_API_BASE=http://localhost:8080/v1` and download models. See `docker-compose.yml` for LocalAI setup.

### Without AI
The app works without AI, but with limited features:
- No automatic summaries
- No content classification
- No semantic search
- Basic keyword search only

## Troubleshooting

### Database Connection Issues
- Ensure Docker containers are running: `docker-compose ps`
- Check database URL in `.env` matches docker-compose.yml
- Verify PostgreSQL is healthy: `docker-compose logs postgres`

### Redis Connection Issues
- Check Redis is running: `docker-compose ps`
- Verify Redis port 6379 is available
- Check Redis logs: `docker-compose logs redis`

### Worker Not Processing
- Ensure worker service is running: `npm run dev:worker`
- Check Redis connection in worker logs
- Verify OpenAI API key is set (if using AI features)

### Search Not Working
- Ensure embeddings are generated (check worker logs)
- Verify OpenAI API key is configured
- Check vector database has stored embeddings

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]
