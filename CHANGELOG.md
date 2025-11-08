# Changelog

All notable changes to Project Synapse will be documented in this file.

## [Phase 15-18] - Semantic Search - 2025-11-08

### Added
- **Semantic Search Engine** - AI-powered search that understands meaning
  - In-memory vector database with cosine similarity
  - OpenAI embedding generation (1536 dimensions)
  - Natural language query support
  - Relevance scoring and ranking

### Backend
- `server/src/services/vector-db.ts` - Vector database service
  - `storeEmbedding()` - Store item embeddings
  - `searchSimilar()` - Find similar items by vector similarity
  - `deleteEmbedding()` - Remove embeddings
  - Cosine similarity calculation
- `server/src/routes/embeddings.ts` - Embedding routes
- `server/src/controllers/embeddings.ts` - Store embeddings from worker
- `server/src/routes/search.ts` - Search routes
- `server/src/controllers/search.ts` - Semantic search logic
  - Query embedding generation
  - Vector similarity search
  - Result ranking and filtering

### Worker
- `worker/src/services/openai.ts` - Added `generateEmbedding()` function
- `worker/src/jobs/process-item.ts` - Generate embeddings after processing
  - Combines title + summary + content
  - Calls `/api/embeddings` to store
  - Graceful fallback if OpenAI not configured

### Frontend
- `client/src/hooks/useSearch.ts` - Search hook
  - `search()` - Submit search query
  - `clearResults()` - Reset search state
  - Loading and error handling
- `client/src/pages/HomePage.tsx` - Search UI
  - Natural language search input
  - Real-time search results
  - Toggle between search and all items
  - Clear search button

### Documentation
- `DEMO-SEARCH.md` - Comprehensive search testing guide
  - How semantic search works
  - Architecture explanation
  - Testing scenarios
  - API documentation
  - Performance characteristics

### Technical Details
- **Model**: `text-embedding-3-small` (cost-effective)
- **Dimensions**: 1536
- **Similarity**: Cosine similarity
- **Threshold**: 0.7 minimum score
- **Storage**: In-memory Map (MVP), ready for Qdrant/Pinecone

## [Phase 13-14] - File Upload & Storage - 2025-11-08

### Added
- **File Upload System** - Support for images, documents, and various file types
  - Multi-part form upload with Multer
  - Local file storage with S3-ready architecture
  - Progress tracking and preview
  - Drag-and-drop UI

### Backend
- `server/src/services/storage.ts` - File storage service
  - `uploadFile()` - Handle file upload to local/S3
  - `deleteFile()` - Remove uploaded files
  - `getFileUrl()` - Get public URL for files
  - Environment-based storage (local vs S3)
- `server/src/controllers/capture-file.ts` - File capture controller
  - File validation and size limits
  - Metadata extraction
  - Queue worker job for processing
- `server/src/routes/capture.ts` - Added file upload route with Multer

### Worker
- `worker/src/jobs/process-item.ts` - File processing stub (OCR planned)

### Frontend
- `client/src/hooks/useCaptureFile.ts` - File upload hook
  - `captureFile()` - Upload with progress tracking
  - Progress percentage tracking
  - FormData construction
- `client/src/components/AddItemModal.tsx` - File tab
  - Drag-and-drop zone
  - File preview with thumbnail
  - Upload progress bar
  - File size display

### Configuration
- `server/.env.example` - Added S3/R2 configuration options

## [Phase 11-12] - Link Capture & Metadata - 2025-11-08

### Added
- **Link Capture** - Save and enrich web URLs
  - Automatic metadata extraction (Open Graph, Twitter Cards)
  - Preview image detection
  - Content extraction for summarization

### Backend
- `server/src/controllers/capture-link.ts` - Link capture controller
  - URL validation with Zod
  - Queue worker job for metadata fetching
- `server/src/routes/capture.ts` - Added `/link` route

### Worker
- `worker/src/services/metadata.ts` - Metadata extraction service
  - `fetchLinkMetadata()` - Fetch and parse Open Graph/Twitter metadata
  - `extractContentText()` - Extract main content from HTML
  - Uses jsdom for HTML parsing
- `worker/src/jobs/process-item.ts` - Link processing
  - Fetch metadata (title, description, image)
  - Generate summary if available
  - Store preview images

### Frontend
- `client/src/hooks/useCaptureLink.ts` - Link capture hook
- `client/src/components/AddItemModal.tsx` - Link tab
  - URL input field
  - Validation feedback
- `client/src/components/ItemCard.tsx` - Display link previews
  - Preview images for links
  - "Visit" link button
  - Image error handling

### Dependencies
- Added `jsdom` for HTML parsing in worker

## [Phase 8-10] - Background Job Processing - 2025-11-08

### Added
- **Worker Service** - Asynchronous job processing with BullMQ
  - Background processing for text items
  - OpenAI integration for summaries and classification
  - Redis-backed job queue

### Infrastructure
- `worker/` package created
- `worker/src/index.ts` - Worker entry point
- `worker/src/config/redis.ts` - Redis connection
- `worker/src/queue/index.ts` - BullMQ queue and worker setup
- `worker/src/jobs/process-item.ts` - Item processing logic
  - Text summarization
  - Content classification
  - Status updates

### AI Integration
- `worker/src/services/openai.ts` - OpenAI API integration
  - `generateSummary()` - Create concise summaries
  - `classifyText()` - Classify item type (NOTE, ARTICLE, TODO, etc.)
  - `analyzeText()` - Combined analysis

### Server Integration
- `server/src/config/queue.ts` - Queue client for server
  - `queueItemProcessing()` - Add jobs from API
- Updated capture controller to queue background jobs

### Configuration
- Added `REDIS_HOST` and `REDIS_PORT` to `.env`
- Added `OPENAI_API_KEY` to `.env`

## [Phase 6-7] - Frontend Foundation - 2025-11-08

### Added
- **React Frontend** with Vite, TypeScript, and Tailwind CSS
  - Modern, responsive UI
  - Type-safe API integration
  - Custom hooks for API calls

### Components
- `client/src/components/Header.tsx` - App header with "Add Item" button
- `client/src/components/AddItemModal.tsx` - Modal for adding items
  - Text input with auto-resize
  - Loading states and success feedback
  - Error handling
  - Keyboard shortcuts (Cmd/Ctrl+Enter to submit)
- `client/src/components/ItemCard.tsx` - Display individual items
  - Type badges and status indicators
  - Preview text with line clamps
  - Relative timestamps
- `client/src/components/MemoryGrid.tsx` - Responsive grid layout
  - Loading skeletons
  - Empty state
  - Responsive columns (1-3 based on screen size)

### Hooks
- `client/src/hooks/useCapture.ts` - Text capture hook
- `client/src/hooks/useItems.ts` - Fetch items hook
  - Auto-refresh capability
  - Loading and error states

### Pages
- `client/src/pages/HomePage.tsx` - Main application view
  - Search input (placeholder for Phase 18)
  - Item count display
  - Memory grid integration

### Styling
- Custom Tailwind configuration with app theme colors
- Utility classes for buttons, cards, inputs
- Responsive design system

## [Phase 4-5] - REST API - 2025-11-08

### Added
- **Capture API** - Endpoints for ingesting content
  - `POST /api/capture` - Capture text input
  - Input validation with Zod
  - Error handling middleware

- **Items API** - Retrieve stored items
  - `GET /api/items` - List all items with full relations
  - Includes content, media, and embeddings

### Infrastructure
- `server/src/routes/` - Route handlers
- `server/src/controllers/` - Business logic
- `server/src/middleware/error-handler.ts` - Centralized error handling
- `server/src/utils/response.ts` - Standardized API responses
- `server/src/utils/logger.ts` - Structured logging

### API Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "..."
}
```

## [Phase 0-3] - Foundation - 2025-11-08

### Added
- **Monorepo Structure** - Multi-package workspace
  - `client/` - React frontend
  - `server/` - Express backend
  - `worker/` - BullMQ job processor
  - `shared/` - Shared types and constants

- **Database Setup** - PostgreSQL with Prisma ORM
  - Schema: Users, Items, Content, Media, Embeddings
  - Enums: ItemType, ItemStatus, MediaType
  - Relations and cascading deletes
  - Prisma migrations

- **Development Environment**
  - Docker Compose for Postgres and Redis
  - TypeScript configuration across all packages
  - ESLint and Prettier for code quality
  - Git hooks (pre-commit, pre-push)

### Database Schema
- `User` - User accounts
- `Item` - Main content items
- `Content` - Text content and metadata
- `Media` - File attachments and images
- `Embedding` - Vector embeddings for search

### Configuration
- `.env.example` files for all packages
- `.gitignore` for common patterns
- `README.md` with setup instructions
- Health check endpoint: `GET /health`

---

## Legend
- 🎯 **Current Phase**
- ✅ **Completed**
- ⏳ **In Progress**
- 📝 **Planned**
