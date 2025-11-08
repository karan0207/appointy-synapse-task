# Project Synapse

**An intelligent second brain for capturing, organizing, and retrieving information.**

Synapse is a web-based prototype that enables you to capture text, links, and files, automatically classify and enrich the content, visualize everything in a unified memory grid, and search using natural language queries.

---

## 🏗️ Architecture

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend API:** Express.js + TypeScript
- **Worker:** BullMQ + Redis for async processing
- **Database:** PostgreSQL with Prisma ORM
- **Storage:** AWS S3 / Cloudflare R2
- **Vector Search:** Qdrant/Pinecone/Weaviate
- **AI/LLM:** OpenAI API

---

## 📦 Repository Structure

```
project-synapse/
├── client/          # React frontend
├── server/          # Express API server
├── worker/          # Background job processor
├── shared/          # Shared types and utilities
├── docker-compose.yml
└── package.json     # Workspace root
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** and **Docker Compose** (for local DB/Redis)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd project-synapse
```

### 2. Install Dependencies

```bash
npm install
```

This will install dependencies for all workspaces (client, server, worker, shared).

### 3. Setup Environment Variables

Create `.env` files for each service (examples below):

**server/.env:**
```bash
DATABASE_URL="postgresql://synapse:synapse_dev_password@localhost:5432/synapse_db"
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3001
NODE_ENV=development
SESSION_SECRET=your_random_secret_here_change_in_production
CLIENT_URL=http://localhost:5173

# Option 1: Use LocalAI (free, runs locally in Docker)
OPENAI_API_KEY=not-needed
OPENAI_API_BASE=http://localhost:8080/v1

# Option 2: Use OpenAI (requires API key)
# OPENAI_API_KEY=sk-your-openai-key-here
# OPENAI_API_BASE=https://api.openai.com/v1
```

**worker/.env:**
```bash
DATABASE_URL="postgresql://synapse:synapse_dev_password@localhost:5432/synapse_db"
REDIS_HOST=localhost
REDIS_PORT=6379
API_URL=http://localhost:3001

# Option 1: Use LocalAI (free, runs locally in Docker)
OPENAI_API_KEY=not-needed
OPENAI_API_BASE=http://localhost:8080/v1

# Option 2: Use OpenAI (requires API key)
# OPENAI_API_KEY=sk-your-openai-key-here
# OPENAI_API_BASE=https://api.openai.com/v1
```

**client/.env:**
```bash
VITE_API_URL=http://localhost:3001
```

> **Note:** `OPENAI_API_KEY` is optional. Without it, AI features (summarization, classification, semantic search) will be disabled, but basic capture and viewing will still work.

### 4. Start Docker Services

Start PostgreSQL, Redis, and LocalAI:

```bash
docker-compose up -d
```

Verify services are running:

```bash
docker-compose ps
# Should see: synapse-postgres, synapse-redis, synapse-localai
```

**Note:** LocalAI takes 1-2 minutes to start first time (downloading models).

Check LocalAI is ready:
```bash
curl http://localhost:8080/readiness
# Should return: {"status":"ready"}
```

### 5. Setup Database with Prisma

Run migrations to create the database schema:

```bash
cd server
npx prisma migrate dev
npx prisma generate
cd ..
```

This creates tables for:
- Users (with password hashing)
- Items (notes, links, files)
- Content (text, HTML, OCR)
- Media (images, attachments)
- Embeddings (vector search references)

Optionally, open Prisma Studio to view the database:

```bash
cd server
npx prisma studio
```

### 6. Start Development Servers

**Option 1: Start all services together (recommended)**

Open 3 terminal windows and run:

```bash
# Terminal 1: Backend API
npm run dev:server

# Terminal 2: Worker
npm run dev:worker

# Terminal 3: Frontend
npm run dev:client
```

Services will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

### 7. Create Your First Account

1. Open http://localhost:5173
2. Click "Sign up"
3. Enter your email, password (min 8 chars), and optional name
4. You'll be automatically logged in

### 8. Test the Features

**Capture Text:**
1. Click "+ Add Item" button
2. Select "Text" tab
3. Type anything: "Remember to buy groceries"
4. Press Cmd+Enter (or click Add)
5. Wait a few seconds for AI processing
6. See the summary and classification!

**Capture Link:**
1. Click "+ Add Item"
2. Select "Link" tab
3. Paste a URL: `https://github.com/features`
4. Wait for metadata extraction
5. See the title, description, and preview image

**Upload File:**
1. Click "+ Add Item"
2. Select "File" tab
3. Drag & drop an image or document
4. Watch the progress bar
5. See your file in the grid

**Semantic Search:**
1. Add multiple items with different topics
2. Use the search bar: "programming tips"
3. See semantically similar results (not just keyword matching)
4. Try: "cooking recipes", "productivity advice", etc.

**Settings:**
1. Click your email in the header
2. Update your profile name
3. Change your password

---

## 📝 Development Workflow

Follow the principles outlined in `instruction.md`:

1. **Build one feature at a time** - complete vertical slices (UI → API → DB)
2. **Test locally** before moving to the next feature
3. **Format and lint** before committing
4. **Use conventional commits** (`feat:`, `fix:`, `chore:`, etc.)

---

## 🗄️ Database Commands

```bash
# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Reset database
cd server && npx prisma migrate reset && cd ..

# Generate Prisma Client
cd server && npx prisma generate && cd ..
```

---

## 🧪 Testing

```bash
# Run linter
npm run lint

# Check formatting
npm run format:check

# Auto-fix formatting
npm run format
```

---

## 🏗️ Building for Production

```bash
# Build all packages
npm run build

# Build specific workspace
npm run build:client
npm run build:server
npm run build:worker
```

---

## 📚 Documentation

- **Problem Statement & Design:** See `problem.md`
- **Development Rules:** See `instruction.md`
- **Implementation Plan:** See `plan.md`

---

## 🎯 MVP Features (100% Complete)

### Core Features ✅
- [x] User authentication (signup, login, sessions)
- [x] Capture text notes instantly
- [x] Capture web links with auto-metadata
- [x] Upload files (images, documents)
- [x] Automatic content classification (NOTE, ARTICLE, TODO, etc.)
- [x] AI-powered summarization
- [x] Memory grid visualization with previews
- [x] Semantic search with natural language
- [x] Background job processing with BullMQ
- [x] Vector embeddings for intelligent search
- [x] User profile & settings
- [x] Password management

### Technology Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router
- **Backend:** Express.js, TypeScript, Zod validation
- **Database:** PostgreSQL with Prisma ORM
- **Queue:** BullMQ + Redis
- **AI:** OpenAI GPT-3.5-turbo & text-embedding-3-small
- **Storage:** Local (S3/R2-ready)
- **Auth:** express-session + bcrypt
- **Vector Search:** In-memory (Qdrant/Pinecone-ready)

---

## 🤝 Contributing

This is a prototype project. Follow the coding guidelines in `instruction.md` when making changes.

---

## 📄 License

Private project - All rights reserved.

