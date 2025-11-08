# Project Synapse — Problem Statement & System Design Document (React + Express Version)

## 🧩 Problem Statement

Modern knowledge workers, developers, and creators constantly encounter valuable information — articles, code snippets, research summaries, screenshots, AI chat results, or even handwritten notes. However, these insights are scattered across tabs, screenshots, and note files — impossible to retrieve later.

**Core problem:**

> There is no unified, intelligent, and private platform that captures everything you encounter (links, text, uploads) and makes it easily retrievable and contextually understood.

Users want a **“second brain”** that:

1. Lets them capture any kind of idea instantly.
2. Automatically understands what they saved (type, context, summary, metadata).
3. Allows them to retrieve anything using natural language — like searching their mind.

---

## 🎯 Vision

**Synapse** is a private, intelligent space that captures, organizes, and understands your digital memory.

It’s not just a notes app — it’s a “memory engine” where everything you save becomes:

* **Visually structured** (article, product, todo, image, etc.)
* **Semantically indexed** for meaning-based retrieval.
* **Instantly accessible** through natural language search.

---

## 💡 MVP Goal

Deliver a **web-based prototype** (no browser extension yet) that enables:

1. **Capture** text, link, or file (from within the web app).
2. **Classify & enrich** data automatically (article, note, todo, product, etc.).
3. **Store & visualize** in a unified visual memory grid.
4. **Search semantically** using natural language queries.

---

## 🏗 System Design

### 1. High-Level Architecture

```
          ┌────────────────────────┐
          │      Web Client        │
          │ (React + Tailwind App) │
          └──────────┬─────────────┘
                     │ REST API
          ┌──────────▼─────────────┐
          │       API Server       │
          │     (Express + Node)   │
          └──────────┬─────────────┘
                     │ Async Queue (Redis)
          ┌──────────▼─────────────┐
          │   Processing Worker    │
          │ - Content Parser       │
          │ - OCR & LLM Summaries  │
          │ - Embedding Generator  │
          └──────────┬─────────────┘
                     │
          ┌──────────▼─────────────┐
          │   Data Layer (Storage) │
          │  - PostgreSQL          │
          │  - S3 (media)          │
          │  - Vector DB (search)  │
          └────────────────────────┘
```

---

### 2. Functional Flow

**a) Capture → Classify → Store → Search**

1. User adds text/link/file via the web interface.
2. Express API receives it and queues a background job.
3. Worker processes:

   * If link → fetches metadata, title, content.
   * If file → runs OCR.
   * If text → generates summary + type.
4. Generates embeddings → stores in vector DB.
5. React UI updates once the enriched item is ready.

**b) Search Flow**

1. User types natural language query.
2. Express server converts query → embedding.
3. Searches semantic index (Vector DB).
4. Merges with structured filters (Postgres metadata).
5. Returns visual cards ranked by relevance.

---

## 🧠 Core Components

| Component              | Description                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------- |
| **Frontend (Web App)** | React + Tailwind, intuitive interface for adding, browsing, and searching items.    |
| **Backend API**        | Express.js, handles capture requests, retrieval, auth, and worker queueing.         |
| **Worker Service**     | Handles CPU-heavy jobs like OCR, metadata scraping, LLM enrichment, and embeddings. |
| **Database Layer**     | PostgreSQL for metadata, S3 for files, Vector DB for semantic search.               |
| **Authentication**     | Clerk or JWT-based system for login and identity management.                        |

---

## 🧱 Data Model

**User**

* id, name, email, created_at

**Item**

* id, user_id, type (article, note, product, image, todo)
* title, summary, source_url, created_at

**Content**

* id, item_id, text, ocr_text, html

**Media**

* id, item_id, s3_url, type, width, height

**Embedding**

* item_id, vector_id (in vector DB)

---

## 🔍 Search & Retrieval Design

1. **Natural Language Search** — powered by embeddings.
2. **Filter Search** — by type, tag, price, or date.
3. **Hybrid Ranking** — combine vector similarity + recency + relevance.

---

## 🛠️ Tech Stack Choices

| Layer                | Technology                                                      | Justification                                                       |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Frontend**         | **React + TypeScript + Tailwind CSS**                           | Lightweight, component-based, great for single-page app experience. |
| **Backend API**      | **Express.js (Node.js)**                                        | Simple REST API, large ecosystem, and fast prototyping.             |
| **Worker Queue**     | **BullMQ + Redis**                                              | For async processing (LLM, OCR, scraping).                          |
| **Database**         | **PostgreSQL**                                                  | Relational schema, JSON support, easy indexing.                     |
| **Object Storage**   | **AWS S3 / Cloudflare R2**                                      | For storing files, screenshots, and OCR images.                     |
| **Vector Search**    | **Weaviate / Pinecone / Qdrant**                                | Semantic similarity search with hybrid filters.                     |
| **LLM / Embeddings** | **OpenAI API / Local Embedding Models**                         | For summarization, classification, and embedding generation.        |
| **Auth**             | **Clerk / Auth.js / JWT**                                       | Quick integration and secure session management.                    |
| **Deployment**       | **Vercel (Frontend)**, **Render / Railway / AWS ECS (Backend)** | Cloud-native, scalable, CI/CD ready.                                |

---

## ⚙️ System Interactions Summary

1. User → Express API: Submit new capture (text/link/file)
2. API → Queue: Dispatch background job
3. Worker → Storage: Process and store structured data
4. Worker → Vector DB: Generate embeddings
5. React UI → API: Query with semantic + filter parameters
6. API → Vector DB + Postgres: Merge + return results

---

## 🧩 Non-Functional Requirements

* **Performance:** <300ms average query latency.
* **Scalability:** Async job processing to scale horizontally.
* **Security:** Data encryption, private user access, tokenized uploads.
* **Privacy:** Option for end-to-end encryption of private notes.

---

## 🚀 Future Extensions

* Browser extension (quick capture overlay)
* Voice capture (“Hey Synapse, remember this idea”)
* Collaborative collections & sharing
* On-device embeddings for privacy mode
* Knowledge graph linking related items

---

## ✅ Deliverables for Cursor Prototype (React + Express)

1. `/capture` API endpoint for text, link, file.
2. Worker script for content enrichment.
3. Simple React frontend with:

   * Add Modal
   * Memory Grid View
   * Search Input
4. Basic semantic search integration (Vector DB).
5. Postgres + S3 integration.

---

### 🎯 MVP Goal Recap

> A single, elegant web app (React + Express) where you can drop anything — text, link, or image — and later retrieve it instantly with a human-like query.

This version is optimized for fast iteration inside Cursor, with a simple Express API, React-based frontend, and worker-driven processing pipeline.
