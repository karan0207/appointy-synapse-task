# Project Synapse — Prototype Development Plan

## 🎯 Overview

This plan breaks down the Project Synapse MVP into **sequential, vertical slices** — each feature is built end-to-end (UI → API → DB) before moving to the next, following the principles in `instruction.md`.

**MVP Core Features:**
1. Capture text, link, or file
2. Classify & enrich automatically
3. Store & visualize in memory grid
4. Semantic search with natural language

**Key Technologies:**
- **Database & ORM:** PostgreSQL + Prisma (type-safe DB access & migrations)
- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Express.js + TypeScript
- **Worker Queue:** BullMQ + Redis
- **Vector Search:** Qdrant/Pinecone/Weaviate
- **AI/LLM:** OpenAI API for embeddings & summarization

---

## 📋 Phase 0: Project Foundation & Setup

**Goal:** Establish project structure, tooling, and local development environment.

### Tasks:
- [ ] **0.1** Initialize monorepo structure (`client/`, `server/`, `worker/`, `shared/`)
- [ ] **0.2** Setup TypeScript configs for each package
- [ ] **0.3** Configure Prettier + ESLint (root + per package)
- [ ] **0.4** Setup `docker-compose.yml` for PostgreSQL + Redis
- [ ] **0.5** Initialize Prisma in `server/` package (`npx prisma init`)
- [ ] **0.6** Create `.env.example` with required variables (DATABASE_URL, etc.)
- [ ] **0.7** Initialize Git repo with `.gitignore`
- [ ] **0.8** Setup root `package.json` with workspace scripts
- [ ] **0.9** Create `README.md` with setup instructions

**Deliverable:** Project structure ready, local DB/Redis running, linting configured.

**Commit:** `chore: initialize project structure and tooling`

---

## 📋 Phase 1: Database Schema & Models

**Goal:** Define and create database schema for core entities using Prisma.

### Tasks:
- [ ] **1.1** Define Prisma schema in `server/prisma/schema.prisma`
  - User model (id, name, email, createdAt)
  - Item model (id, userId, type, title, summary, sourceUrl, status, createdAt)
  - Content model (id, itemId, text, ocrText, html)
  - Media model (id, itemId, s3Url, type, width, height)
  - Embedding model (id, itemId, vectorId)
- [ ] **1.2** Generate Prisma Client (`npx prisma generate`)
- [ ] **1.3** Create initial migration (`npx prisma migrate dev --name init`)
- [ ] **1.4** Setup Prisma Client singleton in `server/src/config/prisma.ts`
- [ ] **1.5** Create TypeScript types from Prisma in `shared/types/` (export from generated types)
- [ ] **1.6** Test: verify tables created, test basic CRUD with Prisma Client

**Deliverable:** Prisma schema defined, migrations applied, Prisma Client configured.

**Commit:** `feat(db): add Prisma schema and migrations`

---

## 📋 Phase 2: Shared Types & Constants

**Goal:** Establish shared TypeScript types and constants across client/server/worker.

### Tasks:
- [ ] **2.1** Define `ItemType` enum (article, note, product, image, todo)
- [ ] **2.2** Create `Item` interface in `shared/types/item.ts`
- [ ] **2.3** Create `CaptureRequest` interface (text, link, file)
- [ ] **2.4** Create `SearchRequest` and `SearchResponse` interfaces
- [ ] **2.5** Define error response types
- [ ] **2.6** Create constants file for item types, error messages

**Deliverable:** Shared types available for import across packages.

**Commit:** `feat(shared): add TypeScript types and constants`

---

## 📋 Phase 3: Express API Foundation

**Goal:** Setup Express server with basic middleware and health check.

### Tasks:
- [ ] **3.1** Initialize Express app in `server/src/index.ts`
- [ ] **3.2** Setup middleware (CORS, body-parser, error handler)
- [ ] **3.3** Create logger utility (`server/src/utils/logger.ts`)
- [ ] **3.4** Create response wrapper utility (`server/src/utils/response.ts`)
- [ ] **3.5** Add health check endpoint (`GET /health`)
- [ ] **3.6** Test server starts and responds to health check

**Deliverable:** Express server running, middleware configured, health check working.

**Commit:** `feat(server): setup Express server with middleware`

---

## 📋 Phase 4: Capture API — Text Input

**Goal:** Implement `/capture` endpoint for text input only (simplest case first).

### Tasks:
- [ ] **4.1** Create `POST /api/capture` route in `server/src/routes/capture.ts`
- [ ] **4.2** Create capture controller in `server/src/controllers/capture.ts`
- [ ] **4.3** Add input validation (text required, max length)
- [ ] **4.4** Create Item record using Prisma Client (type: "note", status: "pending")
- [ ] **4.5** Return item ID and status to client
- [ ] **4.6** Test with Postman/curl: verify DB write, response format

**Deliverable:** Text capture endpoint working, stores to DB via Prisma, returns response.

**Commit:** `feat(api): add text capture endpoint`

---

## 📋 Phase 5: React Frontend — Basic Layout

**Goal:** Setup React app with Tailwind and basic page structure.

### Tasks:
- [ ] **5.1** Initialize React app with Vite + TypeScript
- [ ] **5.2** Configure Tailwind CSS
- [ ] **5.3** Create `App.tsx` with routing setup
- [ ] **5.4** Create `HomePage` component with basic layout
- [ ] **5.5** Create `Header` component
- [ ] **5.6** Test app renders in browser

**Deliverable:** React app running, Tailwind configured, basic layout visible.

**Commit:** `feat(client): setup React app with Tailwind`

---

## 📋 Phase 6: React Frontend — Add Item Modal (Text)

**Goal:** Build "Add Item" modal that captures text and calls `/capture` API.

### Tasks:
- [ ] **6.1** Create `AddItemModal` component
- [ ] **6.2** Add form with text input and submit button
- [ ] **6.3** Create `useCapture` hook in `client/src/hooks/useCapture.ts`
- [ ] **6.4** Connect modal to `/api/capture` endpoint
- [ ] **6.5** Add loading state and success/error feedback
- [ ] **6.6** Test: submit text, verify API call, check DB

**Deliverable:** Modal opens, captures text, calls API, shows feedback.

**Commit:** `feat(client): add text capture modal`

---

## 📋 Phase 7: Memory Grid — Display Items

**Goal:** Create grid view to display captured items from database.

### Tasks:
- [ ] **7.1** Create `GET /api/items` endpoint (list all items)
- [ ] **7.2** Create `ItemCard` component to display item
- [ ] **7.3** Create `MemoryGrid` component (grid layout)
- [ ] **7.4** Create `useItems` hook to fetch items
- [ ] **7.5** Display items in grid on HomePage
- [ ] **7.6** Test: capture item, verify it appears in grid

**Deliverable:** Grid displays all captured items with title/summary.

**Commit:** `feat(client): add memory grid view`

---

## 📋 Phase 8: Worker Queue Setup

**Goal:** Setup Redis + BullMQ for background job processing.

### Tasks:
- [ ] **8.1** Initialize worker package in `worker/`
- [ ] **8.2** Setup Redis connection in `worker/src/config/redis.ts`
- [ ] **8.3** Setup BullMQ queue in `worker/src/queue/index.ts`
- [ ] **8.4** Create `process-item` job type definition
- [ ] **8.5** Update `/capture` endpoint to queue job after DB insert
- [ ] **8.6** Test: capture item, verify job appears in queue

**Deliverable:** Queue system working, jobs queued from API.

**Commit:** `feat(worker): setup Redis queue system`

---

## 📋 Phase 9: Worker — Basic Text Processing

**Goal:** Worker processes text items, generates summary, updates DB.

### Tasks:
- [ ] **9.1** Create `worker/src/jobs/process-item.ts` job handler
- [ ] **9.2** Setup Prisma Client in worker (shared config)
- [ ] **9.3** Fetch item from DB by ID using Prisma
- [ ] **9.4** For text items: call OpenAI API to generate summary
- [ ] **9.5** Update item in DB using Prisma (summary, status: "processed")
- [ ] **9.6** Setup worker entry point (`worker/src/index.ts`)
- [ ] **9.7** Test: capture text, verify worker processes, DB updated

**Deliverable:** Worker processes text, generates summary, updates item via Prisma.

**Commit:** `feat(worker): add text processing job`

---

## 📋 Phase 10: Capture API — Link Input

**Goal:** Extend `/capture` to handle URL links.

### Tasks:
- [ ] **10.1** Update capture validation to accept `url` field
- [ ] **10.2** Store link item in DB (type: "article", source_url)
- [ ] **10.3** Update worker to detect link items
- [ ] **10.4** Add link metadata fetching (title, description) in worker
- [ ] **10.5** Update item with fetched metadata
- [ ] **10.6** Test: capture link, verify metadata fetched

**Deliverable:** Link capture working, metadata extracted.

**Commit:** `feat(api): add link capture support`

---

## 📋 Phase 11: React Frontend — Link Input in Modal

**Goal:** Extend AddItemModal to support link input.

### Tasks:
- [ ] **11.1** Add tab/toggle in modal: "Text" vs "Link"
- [ ] **11.2** Add URL input field for link mode
- [ ] **11.3** Update `useCapture` hook to handle both types
- [ ] **11.4** Test: capture link from UI, verify in grid

**Deliverable:** Modal supports both text and link capture.

**Commit:** `feat(client): add link capture to modal`

---

## 📋 Phase 12: S3 Integration — File Upload

**Goal:** Setup S3 (or Cloudflare R2) for file storage.

### Tasks:
- [ ] **12.1** Setup S3 client in `server/src/services/storage.ts`
- [ ] **12.2** Add file upload middleware (multer)
- [ ] **12.3** Update `/capture` to handle file uploads
- [ ] **12.4** Upload file to S3, store URL in Media table
- [ ] **12.5** Create item with type "image" or "file"
- [ ] **12.6** Test: upload file, verify S3 upload, DB record

**Deliverable:** File upload working, stored in S3, referenced in DB.

**Commit:** `feat(api): add file upload to S3`

---

## 📋 Phase 13: Worker — OCR & File Processing

**Goal:** Worker processes uploaded files (OCR for images, extract text).

### Tasks:
- [ ] **13.1** Add OCR service (Tesseract.js or API) in worker
- [ ] **13.2** Download file from S3 in worker
- [ ] **13.3** Run OCR on image files
- [ ] **13.4** Store OCR text in Content table
- [ ] **13.5** Generate summary from OCR text
- [ ] **13.6** Test: upload image, verify OCR text extracted

**Deliverable:** Worker processes files, extracts text via OCR.

**Commit:** `feat(worker): add OCR processing for images`

---

## 📋 Phase 14: React Frontend — File Upload in Modal

**Goal:** Add file upload to AddItemModal.

### Tasks:
- [ ] **14.1** Add "File" tab to modal
- [ ] **14.2** Add file input with drag-and-drop
- [ ] **14.3** Update `useCapture` to handle FormData upload
- [ ] **14.4** Show upload progress indicator
- [ ] **14.5** Test: upload file, verify in grid

**Deliverable:** File upload working from UI.

**Commit:** `feat(client): add file upload to modal`

---

## 📋 Phase 15: Vector DB Setup

**Goal:** Integrate vector database for semantic search.

### Tasks:
- [ ] **15.1** Choose vector DB (Qdrant recommended for local dev)
- [ ] **15.2** Setup vector DB client in `server/src/services/vector-db.ts`
- [ ] **15.3** Create collection/schema for embeddings
- [ ] **15.4** Test connection and basic operations

**Deliverable:** Vector DB connected and ready.

**Commit:** `feat(server): setup vector database`

---

## 📋 Phase 16: Worker — Generate Embeddings

**Goal:** Worker generates embeddings for processed items and stores in vector DB.

### Tasks:
- [ ] **16.1** Add embedding service (OpenAI or local model)
- [ ] **16.2** Generate embedding from item text + summary
- [ ] **16.3** Store embedding in vector DB with item_id
- [ ] **16.4** Update Embedding table in Postgres (vector_id reference)
- [ ] **16.5** Test: process item, verify embedding stored

**Deliverable:** Embeddings generated and stored for all processed items.

**Commit:** `feat(worker): add embedding generation`

---

## 📋 Phase 17: Search API — Semantic Search

**Goal:** Implement `/search` endpoint with semantic search.

### Tasks:
- [ ] **17.1** Create `POST /api/search` route
- [ ] **17.2** Convert query text to embedding
- [ ] **17.3** Query vector DB for similar items
- [ ] **17.4** Fetch full item details from Postgres
- [ ] **17.5** Rank and return results
- [ ] **17.6** Test: search query, verify relevant results

**Deliverable:** Semantic search endpoint working.

**Commit:** `feat(api): add semantic search endpoint`

---

## 📋 Phase 18: React Frontend — Search UI

**Goal:** Add search input and results display.

### Tasks:
- [ ] **18.1** Create `SearchBar` component
- [ ] **18.2** Create `useSearch` hook
- [ ] **18.3** Add debounced search input
- [ ] **18.4** Display search results in grid (replace or filter)
- [ ] **18.5** Show "No results" state
- [ ] **18.6** Test: search query, verify results update

**Deliverable:** Search UI working, results displayed.

**Commit:** `feat(client): add semantic search UI`

---

## 📋 Phase 19: Item Classification

**Goal:** Worker classifies items (article, note, todo, product, image).

### Tasks:
- [ ] **19.1** Add classification logic in worker (LLM prompt)
- [ ] **19.2** Update item type based on classification
- [ ] **19.3** Store classification confidence/metadata
- [ ] **19.4** Update ItemCard to show type badge
- [ ] **19.5** Test: capture various items, verify classification

**Deliverable:** Items automatically classified by type.

**Commit:** `feat(worker): add item classification`

---

## 📋 Phase 20: Polish & Error Handling

**Goal:** Add error handling, loading states, and UI polish.

### Tasks:
- [ ] **20.1** Add error boundaries in React
- [ ] **20.2** Improve error messages in API responses
- [ ] **20.3** Add loading skeletons for grid
- [ ] **20.4** Add retry logic for failed API calls
- [ ] **20.5** Polish modal animations and transitions
- [ ] **20.6** Test error scenarios (network failure, invalid input)

**Deliverable:** App handles errors gracefully, UI polished.

**Commit:** `feat: add error handling and UI polish`

---

## 📋 Phase 21: Authentication (Optional for MVP)

**Goal:** Add basic authentication to protect user data.

### Tasks:
- [ ] **21.1** Choose auth solution (Clerk recommended)
- [ ] **21.2** Setup auth middleware in Express
- [ ] **21.3** Protect API routes (require user_id)
- [ ] **21.4** Add login UI in React
- [ ] **21.5** Filter items by user_id in queries
- [ ] **21.6** Test: login, verify user-specific data

**Deliverable:** Authentication working, user data isolated.

**Commit:** `feat: add authentication`

---

## ✅ MVP Completion Checklist

Before marking MVP as complete:

- [ ] All 4 core features working:
  - [ ] Capture text, link, file
  - [ ] Automatic classification & enrichment
  - [ ] Memory grid visualization
  - [ ] Semantic search
- [ ] No console errors or warnings
- [ ] Code passes lint/format checks
- [ ] Prisma migrations tested (up/down, reset)
- [ ] Prisma schema in sync with database
- [ ] Worker processes all item types
- [ ] Search returns relevant results
- [ ] UI is functional and responsive
- [ ] README updated with setup instructions and Prisma commands

---

## 🎯 Development Workflow Per Phase

For each phase, follow this workflow:

1. **Define Goal** — Write goal comment in files
2. **Implement** — Build minimal working version
3. **Test** — Verify end-to-end functionality
4. **Polish** — Format, lint, remove console logs
5. **Commit** — Use conventional commit message
6. **Move On** — Only proceed when current phase is complete

---

## 📊 Estimated Timeline

- **Phase 0-3:** Foundation (1-2 days)
- **Phase 4-7:** Basic capture & display (2-3 days)
- **Phase 8-9:** Worker setup & processing (1-2 days)
- **Phase 10-11:** Link support (1 day)
- **Phase 12-14:** File upload (2 days)
- **Phase 15-18:** Semantic search (2-3 days)
- **Phase 19-21:** Polish & auth (2 days)

**Total MVP:** ~12-15 days of focused development

---

## 🚀 Next Steps After MVP

1. Browser extension for quick capture
2. Advanced filtering (by type, date, tags)
3. Item editing and deletion
4. Knowledge graph visualization
5. Collaborative features
6. Voice capture

---

This plan ensures **one feature at a time**, **vertical slices**, and **incremental validation** — exactly as specified in `instruction.md`.
