# Cursor Project Rules & Development Workflow

## 🎯 Purpose

This document defines the **coding principles, repo structure, and workflow rules** for developing high-quality, maintainable prototypes in **Cursor** — especially for modular, scalable projects like **Project Synapse**.

The goal is to ensure every feature is built with clarity, structure, and incremental validation — one functionality at a time.

---

## 🧩 Core Principles

### 1. **Build One Functionality at a Time**

* Always work in **focused units** — implement, test, and validate one feature before adding the next.
* Every commit or PR should represent a **complete and functional feature**, not partial scaffolding.
* Avoid multitasking multiple modules. Complete the flow end-to-end (UI → API → DB → UI feedback).

**Example:**

* ✅ Implement and test `/capture` API fully before starting `/search`.
* ✅ Finish “Add Item” modal UI and ensure it connects correctly to the API before styling.

---

### 2. **Code Quality Rules**

* Follow **consistent formatting** using Prettier + ESLint.
* Keep functions **short, readable, and pure** — one clear purpose per function.
* Avoid deep nesting — prefer early returns.
* Use **TypeScript** for type safety and IntelliSense benefits.
* Prefer **async/await** over callbacks or chaining.
* Document critical functions using JSDoc or inline comments.
* Never push code with console logs, unused imports, or commented blocks.

**Naming Conventions:**

* Files: `kebab-case.js`
* Components: `PascalCase.jsx`
* Variables/functions: `camelCase`
* Constants: `UPPER_SNAKE_CASE`

---

### 3. **Prototype with Intent (Cursor Workflow)**

* Use Cursor’s **AI-assisted iteration loop** efficiently:

  1. Start with a clear **goal description** comment at the top of each file.
  2. Write the minimal working implementation.
  3. Use Cursor to optimize, but manually validate logic before committing.
  4. Never refactor multiple files in one step — validate per file.

* Keep commits atomic: each should add measurable progress (new API route, working UI component, or database schema change).

---

## 🗂️ Repository Structure (React + Express + Worker)

```
root/
├── client/                  # React app (frontend)
│   ├── src/
│   │   ├── components/      # Reusable UI components (Button, Card, Modal, etc.)
│   │   ├── pages/           # Feature pages (Home, Search, AddItem)
│   │   ├── hooks/           # Custom hooks (useFetch, useSearch)
│   │   ├── context/         # Context providers (Auth, Theme)
│   │   ├── utils/           # Helpers (dateFormat, debounce)
│   │   └── styles/          # Tailwind config, globals
│   └── package.json
│
├── server/                  # Express backend API
│   ├── src/
│   │   ├── routes/          # Route handlers (capture, search, auth)
│   │   ├── controllers/     # Business logic for each route
│   │   ├── services/        # External APIs, AI/LLM, vector DB integrations
│   │   ├── models/          # DB models (Postgres schemas)
│   │   ├── middleware/      # Auth, error handling, validation
│   │   ├── utils/           # Helpers (logger, response wrapper)
│   │   ├── config/          # Env, DB, and Redis setup
│   │   └── index.ts         # Express entry point
│   └── package.json
│
├── worker/                  # Async background job processor
│   ├── jobs/                # Individual job definitions (OCR, summarize, embed)
│   ├── queue/               # Redis/BullMQ setup
│   ├── utils/               # Shared helpers
│   ├── config/              # Worker env setup
│   └── index.ts             # Worker entry point
│
├── shared/                  # Shared schemas, types, constants
│   ├── types/               # Common TypeScript interfaces
│   ├── constants/           # Shared constants (item types, error messages)
│   └── utils/               # Cross-layer utility functions
│
├── .env                     # Environment variables
├── docker-compose.yml       # Local setup for DB, Redis, etc.
├── README.md                # Project overview
└── package.json             # Root dependencies and scripts
```

---

## 🧠 Coding Workflow

### Step 1 — Define Feature Goal

Write it in comments before coding.

```js
// Goal: Implement /capture API endpoint to handle text, link, and file uploads.
// Steps: Validate → Store → Queue Job → Return Response
```

### Step 2 — Build Core Logic

Focus on a working implementation before adding enhancements.

### Step 3 — Test Locally

* Run with mock data.
* Check for validation, DB writes, and console outputs.

### Step 4 — Polish & Commit

* Format with Prettier.
* Run lint check.
* Write clear commit message: `feat(api): add capture endpoint`.

---

## 🚦 Commit & Branching Rules

* Main branch = always deployable.
* Create a new branch for each feature: `feature/<name>`.
* Use conventional commits:

  * `feat:` → new feature
  * `fix:` → bug fix
  * `refactor:` → internal code improvement
  * `chore:` → maintenance task
  * `docs:` → documentation only

Example: `feat(client): add memory grid UI`

---

## ✅ Prototype Development Flow

1. **Define the goal** of this iteration.
2. **Implement only one vertical slice:** UI → API → DB.
3. **Run and verify end-to-end functionality.**
4. **Polish UI/UX minimally** — focus on correctness.
5. **Document any design decision or known issue** inline or in `/docs`.
6. **Commit and push.**

---

## 🧩 Quality Checklist

Before marking any feature as done:

* [ ] No console errors or warnings.
* [ ] Input validation exists.
* [ ] Data flows from UI → API → DB correctly.
* [ ] Code commented where logic is non-trivial.
* [ ] Code passes lint/format checks.
* [ ] Functionality demo tested in browser.

---

## 🧭 Guiding Philosophy

> “Prototypes should feel minimal yet deliberate.”

Each piece of code should:

* Be **clean enough to extend later**, but **simple enough to throw away**.
* Favor **clarity over cleverness**.
* Prioritize **functionality → feedback → refinement.**

---

## 🧰 Recommended Tools

* **Formatter:** Prettier
* **Linter:** ESLint (airbnb or standard config)
* **Git hooks:** Husky + lint-staged (auto lint/format before commit)
* **Env management:** dotenv
* **Testing:** Vitest / Jest for unit tests, Cypress for integration
* **Docs:** `/docs` folder with .md files per module

---

## 📦 Deployment Tips

* Use `.env.local` for dev, `.env.prod` for production.
* Always validate DB schema via migrations before deployment.
* Containerize using Docker for consistent environments.
* Setup CI/CD (GitHub Actions or Vercel/Render Deploy Hooks).

---

### 🧭 In Short

> * Code with intent, one feature at a time.
> * Keep structure modular and predictable.
> * Use Cursor to assist, not automate architecture.
> * Aim for **readable, prototype-grade clarity**, not premature optimization.

---

This document serves as the **development contract** for all Cursor-based projects — ensuring consistency, maintainability, and clarity as the prototype evolves into production-grade software.
