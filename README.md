<div align="center">

# 🧠 Evangadi Forum

### *Learn together. Ask with context.*

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

**A full-stack, AI-powered technical Q&A forum built for Evangadi Networks learners and mentors.**

[Features](#-features) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [API Reference](#-api-reference) · [Design System](#-design-system)

</div>

---

## 📖 Overview

**Evangadi Forum** is a modern learning platform that combines peer-to-peer technical Q&A with intelligent AI assistance. Learners can post structured questions, receive markdown-rich answers, search the archive by keyword or semantic meaning, upload course PDFs for retrieval-augmented generation (RAG), and chat with an official Evangadi knowledge-base assistant — all in one calm, focused workspace.

> **Tagline:** *A calm place for technical Q&A — with enough context for peers to help in one pass.*

### Why this project?

| Challenge | Solution |
|-----------|----------|
| Duplicate questions across a cohort | **Semantic search** finds similar threads by meaning, not just keywords |
| Vague or incomplete posts | **AI draft coach** suggests improvements before publishing |
| Answers that miss the point | **Answer-fit check** scores draft relevance before posting |
| Generic AI hallucinations | **RAG pipeline** grounds answers in uploaded course materials with citations |
| Scattered program information | **Evangadi Assistant** answers from an official, ingested knowledge base |

---

## ✨ Features

### 🔐 Authentication & User Management
- JWT-based register / login with bcrypt password hashing
- Protected routes with automatic 401 redirect
- Per-user ownership for questions, answers, and documents

### 💬 Forum & Threads
- Post questions with markdown support (title, context, code blocks)
- Hash-based shareable URLs (`/questions/:questionHash`)
- Threaded replies with full markdown rendering
- **Your Topics** — filter to questions you've authored

### 🔍 Dual Search Modes
- **Keyword search** — SQL `LIKE` + MySQL `FULLTEXT` on title and content
- **Semantic search** — Gemini embeddings + cosine similarity across all question vectors

### 🤖 AI-Powered Helpers

| Feature | Endpoint | What it does |
|---------|----------|--------------|
| **Draft Coach** | `POST /api/questions/draft-coach` | 3–5 actionable tips to improve a question draft |
| **Answer Fit** | `POST /api/questions/:hash/answer-fit` | Rates draft relevance (`strong` / `partial` / `weak`) |
| **Similar Questions** | `GET /api/questions/:hash/similar` | Surfaces related threads on the detail page |

### 📚 Knowledge Base (RAG)
- Upload personal PDFs — parsed, chunked, and embedded with page-aware chunks
- **Intent-aware retrieval** — overview questions use broader coverage; factual questions stay precise
- Semantic search within a single document (ranked excerpts + page ranges)
- AI Q&A grounded in retrieved chunks with numbered citations
- **Reprocess** — re-chunk and re-embed an existing PDF with the current ingest pipeline
- In-browser PDF preview, processing status polling, and per-user document library

### 🗣️ Evangadi Assistant (Chatbot)
- Persistent **Ask AI** drawer that stays open across in-app navigation
- Full-page chat at `/chatbot` when preferred
- Retrieval-augmented responses with conversation history
- Citation-backed answers from the official Evangadi knowledge base
- One-time knowledge-base ingestion via `POST /api/chatbot/ingest`

### 🎨 Experience & Shell
- Collapsible sidebar (full labels ↔ icon rail)
- Light / dark theme with persistent preference
- Shared design tokens across marketing and authenticated pages

---

## 🏗 Architecture

### High-Level System Diagram

```mermaid
flowchart TB
    subgraph Client["🖥️ Frontend — React 19 + Vite"]
        Landing["Landing Page"]
        Dashboard["Dashboard / Feed"]
        PostQ["Ask Question"]
        QDetail["Question Detail"]
        RAG["Knowledge Base"]
        Drawer["Ask AI Drawer"]
        Chat["Evangadi Assistant"]
        Auth["Auth Pages"]
    end

    subgraph API["⚙️ Backend — Express 5"]
        AuthAPI["/api/auth"]
        QAPI["/api/questions"]
        AAPI["/api/answers"]
        RAGAPI["/api/rag"]
        BotAPI["/api/chatbot"]
    end

    subgraph Data["🗄️ Data Layer"]
        MySQL[("MySQL 8")]
        FS["File System\nrag-uploads/"]
        KB["Knowledge Base\n.txt"]
    end

    subgraph AI["🧠 Google Gemini"]
        Embed["Embedding Models"]
        Gen["Generation Models"]
    end

    Client -->|REST + JWT| API
    API --> MySQL
    RAGAPI --> FS
    BotAPI --> KB
    API --> Embed
    API --> Gen
```

### Request Flow — Semantic Search

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Express API
    participant G as Gemini API
    participant DB as MySQL

    U->>FE: Enter semantic search query
    FE->>BE: GET /api/questions/search?query=...
    BE->>G: Embed query text
    G-->>BE: Embedding vector
    BE->>DB: Load question_vectors (status=ready)
    BE->>BE: Cosine similarity + threshold filter
    BE-->>FE: Top-k ranked questions
    FE-->>U: Display similar threads
```

### RAG Pipeline

```mermaid
flowchart LR
    A["📄 Upload PDF"] --> B["Parse pages\n(pdf-parse)"]
    B --> C["Chunk + page ranges"]
    C --> D["Embed chunks\n(Gemini, concurrent)"]
    D --> E[("MySQL\ndocuments + chunks + vectors")]
    E --> F{"Query intent"}
    F -->|factual| G["Similarity top-k"]
    F -->|overview| H["Broader top-k +\nearly-page seeds"]
    G --> I["💬 Generate + cite"]
    H --> I
    E --> J["🔁 Reprocess\nre-chunk + re-embed"]
```

### Backend Pattern

```text
routes → controller → service → repository / SQL
         ↑
    express-validator (input validation)
    authentication.js (JWT middleware)
```

---

## 🛠 Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **Vite 8** | Build tool & dev server |
| **React Router 7** | Client-side routing |
| **Axios** | HTTP client with JWT interceptors |
| **Framer Motion** | Landing page animations |
| **Lucide React** | Icon system |
| **react-markdown** | Markdown rendering in threads |
| **CSS Modules** | Scoped, component-level styling |
| **Vitest** | Unit testing (configured) |

### Backend

| Technology | Purpose |
|------------|---------|
| **Express 5** | REST API server |
| **MySQL 2** | Relational database + connection pool |
| **jsonwebtoken** | JWT authentication |
| **bcryptjs** | Password hashing |
| **express-validator** | Request validation |
| **Multer** | PDF file uploads |
| **pdf-parse** | PDF text extraction |
| **@google/genai** | Gemini embeddings & text generation |

### AI / ML

| Model | Used For |
|-------|----------|
| `gemini-embedding-001` | Question & document chunk embeddings |
| `text-embedding-004` | Chatbot knowledge-base embeddings (default fallback) |
| `gemini-2.5-flash-lite` | Draft coach, answer fit, RAG Q&A |
| Configurable generation model | Chatbot conversation (`GEMINI_GENERATION_MODEL` / `GEMINI_TEXT_MODEL`) |

> Vectors are stored as MySQL `JSON` columns. Similarity is computed in Node.js via cosine similarity — no dedicated vector database required.

---

## 📁 Project Structure

```text
AI_Powered_Forum/
│
├── 📂 backend/
│   ├── index.js                          # Express entry point
│   ├── db/
│   │   ├── db.config.js                  # MySQL pool + safeExecute()
│   │   └── schema.sql                    # Database DDL
│   ├── rag-uploads/                      # User PDF storage (per-user dirs)
│   ├── scripts/                          # RAG diagnose / reprocess / validate
│   └── src/
│       ├── api/
│       │   ├── routes.js                 # Route aggregator
│       │   ├── auth/                     # Register & login
│       │   ├── question/                 # CRUD + semantic search + AI coach
│       │   ├── answer/                   # CRUD answers
│       │   ├── rag/                      # PDF upload, search, RAG Q&A, reprocess
│       │   └── chatbot/                  # KB ingest + chat assistant
│       ├── middleware/                   # Auth, validation, error handling, upload
│       └── utils/errors/                 # Typed HTTP error classes
│
├── 📂 frontend/
│   └── src/
│       ├── App.jsx                       # Route map
│       ├── config/navConfig.js           # Sidebar + page chrome metadata
│       ├── contexts/                     # Auth, theme, sidebar, chat session
│       ├── components/                   # Layout, Sidebar, Navbar, Ask AI drawer…
│       ├── pages/                        # Landing, Dashboard, ChatBot, RAG…
│       ├── services/                     # Axios API clients per domain
│       ├── index.css                     # Global design tokens (light + dark)
│       └── styles/pageStates.module.css  # Shared loading/empty states
│
└── README.md
```

### Frontend Routes

| Path | Page | Access |
|------|------|--------|
| `/` | Landing (marketing) | Public |
| `/auth` | Login / Register | Public |
| `/dashboard` | Home feed + search | Protected |
| `/questions/ask` | Post a question + AI coach | Protected |
| `/questions/:hash` | Thread detail + similar topics | Protected |
| `/my-questions` | Your authored topics | Protected |
| `/rag-documents` | Knowledge base (PDF RAG) | Protected |
| `/chatbot` | Evangadi Assistant (full page) | Protected |

> The **Ask AI** control opens a persistent drawer from the app shell; it shares session state with `/chatbot`.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (ES modules)
- **MySQL** 8+
- **Google Gemini API key** — [Get one here](https://aistudio.google.com/apikey)

### 1. Clone the repository

```bash
git clone <repository-url>
cd AI_Powered_Forum
```

### 2. Set up the database

```bash
mysql -u <your-mysql-user> -p < backend/db/schema.sql
```

Then create the chatbot table (required for the Evangadi Assistant):

```sql
CREATE TABLE chatbot_chunks (
    chunk_id    BIGINT AUTO_INCREMENT PRIMARY KEY,
    chunk_index INT NOT NULL UNIQUE,
    content     TEXT NOT NULL,
    embedding   JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. Configure environment variables

> 🔒 **Never commit `.env` files.** Copy the templates below into local `.env` files only. Use strong, unique values for secrets — the examples are placeholders, not real credentials.

**`backend/.env`** (create locally; do not commit)

```env
PORT=5000
DB_HOST=<your-db-host>
DB_USER=<your-db-user>
DB_PASSWORD=<your-db-password>
DB_NAME=<your-db-name>

JWT_SECRET=<generate-a-long-random-secret>
JWT_EXPIRES_IN=1d

GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
GEMINI_TEXT_MODEL=gemini-2.5-flash-lite

# Forum semantic recommendations
RECOMMEND_THRESHOLD=0.75
RECOMMEND_K=5

# RAG retrieval (optional overrides)
# RAG_TOP_K=12
# RAG_SIMILARITY_THRESHOLD=0.6
# RAG_OVERVIEW_TOP_K=16
# RAG_EMBEDDING_CONCURRENCY=3
# RAG_DIAGNOSTICS=true
```

**`frontend/.env`** (create locally; do not commit)

```env
VITE_API_BASE_URL=http://localhost:5000
```

> ⚠️ Set `VITE_API_BASE_URL` to match your backend `PORT`. If unset, the frontend client falls back to the configured production API host.

### 4. Install dependencies & run

**Terminal 1 — Backend**

```bash
cd backend
npm install
npm run dev        # nodemon → http://localhost:5000
```

**Terminal 2 — Frontend**

```bash
cd frontend
npm install
npm run dev        # Vite → http://localhost:5173
```

### 5. Ingest the chatbot knowledge base

After registering and logging in, trigger a one-time ingestion:

```bash
curl -X POST http://localhost:<backend-port>/api/chatbot/ingest \
  -H "Authorization: Bearer <your-jwt-token>"
```

Verify readiness:

```bash
curl http://localhost:<backend-port>/api/chatbot/status \
  -H "Authorization: Bearer <your-jwt-token>"
```

> 🔒 In production, restrict `/api/chatbot/ingest` to trusted operators only. It rewrites the shared knowledge-base index and should not be callable by every authenticated user.

---

## 📡 API Reference

Base URL (local development): `http://localhost:<backend-port>/api`

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | — | Server health status |

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/register` | — | Create a new account |
| `POST` | `/login` | — | Authenticate and receive JWT |

### Questions — `/api/questions`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/` | ✅ | Create a question (auto-embeds title) |
| `GET` | `/` | ✅ | List questions (`?search=`, `?mine=true`) |
| `GET` | `/search` | ✅ | Semantic search (`?query=`, `?k=`, `?threshold=`) |
| `POST` | `/draft-coach` | ✅ | AI tips for improving a draft |
| `GET` | `/:questionHash` | ✅ | Single question + all answers |
| `GET` | `/:questionHash/similar` | ✅ | Similar questions by vector |
| `POST` | `/:questionHash/answer-fit` | ✅ | AI relevance check on answer draft |

### Answers — `/api/answers`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/` | ✅ | Post an answer |
| `GET` | `/:answerId` | — | Fetch a single answer |
| `PATCH` | `/:answerId` | ✅ | Update own answer |
| `DELETE` | `/:answerId` | ✅ | Delete own answer |

### RAG — `/api/rag`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/documents` | ✅ | Upload PDF (`multipart/form-data`) |
| `GET` | `/documents` | ✅ | List user's documents |
| `GET` | `/documents/:id` | ✅ | Document metadata |
| `POST` | `/documents/:id/reprocess` | ✅ | Re-chunk and re-embed with current pipeline |
| `DELETE` | `/documents/:id` | ✅ | Delete document + file + chunks |
| `GET` | `/documents/:id/file` | ✅ | Stream PDF file |
| `GET` | `/documents/:id/search` | ✅ | Semantic search within document |
| `POST` | `/documents/:id/query` | ✅ | RAG Q&A with citations |

### Chatbot — `/api/chatbot`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/ingest` | ✅ | Ingest knowledge base (optional `?force=true`) |
| `GET` | `/status` | ✅ | Check readiness and chunk count |
| `POST` | `/chat` | ✅ | Chat (`{ message, history? }`) |

**Authentication header for protected routes:**

```http
Authorization: Bearer <jwt-token>
```

---

## 🗄 Database Schema

```mermaid
erDiagram
    users ||--o{ questions : "posts"
    users ||--o{ answers : "writes"
    users ||--o{ documents : "owns"
    questions ||--o| question_vectors : "has embedding"
    questions ||--o{ answers : "has"
    documents ||--o{ document_chunks : "contains"
    document_chunks ||--o| document_chunk_vectors : "has embedding"

    users {
        int user_id PK
        string first_name
        string last_name
        string email UK
        string password_hash
    }

    questions {
        int question_id PK
        char question_hash UK
        int user_id FK
        string title
        text content
    }

    question_vectors {
        bigint vector_id PK
        int question_id FK
        json embedding
        string status
    }

    answers {
        int answer_id PK
        int question_id FK
        int user_id FK
        text content
    }

    documents {
        int document_id PK
        int user_id FK
        string title
        string storage_path
        string status
    }

    document_chunks {
        bigint chunk_id PK
        int document_id FK
        text content
        int page_start
        int page_end
    }

    document_chunk_vectors {
        bigint chunk_vector_id PK
        bigint chunk_id FK
        json embedding
    }

    chatbot_chunks {
        bigint chunk_id PK
        int chunk_index UK
        text content
        json embedding
    }
```

---

## 🎨 Design System

The UI follows a **clean, modern aesthetic** — generous whitespace, a restrained slate palette, and a vibrant orange accent. CSS custom properties in `frontend/src/index.css` keep the entire app visually consistent across light and dark themes.

### Color Palette

| Token | Light value | Usage |
|-------|-------------|-------|
| `--primary` | `#f97316` 🟠 | CTAs, focus rings, active navigation |
| `--text-primary` | `#0f172a` | Headings and body text |
| `--background` | `#f8fafc` | Page background |
| `--border` | `#e2e8f0` | Cards, dividers, inputs |
| `--success` | `#10b981` 🟢 | Positive states |
| `--error` | `#ef4444` 🔴 | Error states |
| `--info` | `#3b82f6` 🔵 | Informational badges |

Dark mode reuses the same token names under `[data-theme="dark"]`, so components flip automatically without per-page theme forks.

### Layout

```text
┌────────────────────────────────────────────────────────────────┐
│  Sidebar (17rem / 4.5rem) │  Navbar + Theme + Ask AI           │
│  ───────────────────────  │  ────────────────────────────────  │
│  🏠 Home                  │                                    │
│  💬 Your Topics           │  Main Content Area                 │
│  📄 Knowledge Base        │  (max-width: 80rem)                │
│                           │                                    │
│  [New Question]           │           │ Ask AI drawer (opt.)   │
│  👤 User / Logout         │           │                        │
└────────────────────────────────────────────────────────────────┘
```

- **Font:** Inter (with system-ui / `-apple-system` fallback)
- **Icons:** Lucide React
- **Animations:** Framer Motion on the landing hero
- **Styling:** CSS Modules per component — no utility-class framework
- **Shell state:** `ThemeProvider`, `SidebarProvider`, and `ChatSessionProvider` keep chrome in sync

---

## 🧪 Testing, Diagnostics & Linting

```bash
# Backend — Node.js built-in test runner
cd backend && npm test

# Optional RAG operator scripts
cd backend
npm run rag:diagnose
npm run rag:reprocess
npm run rag:validate

# Frontend — Vitest + Testing Library
cd frontend && npm test          # single run
cd frontend && npm run test:watch  # watch mode
cd frontend && npm run lint        # ESLint
```

---

## 📦 Production Build

```bash
# Frontend static build
cd frontend
npm run build        # outputs to frontend/dist/
npm run preview      # local preview of production build

# Backend
cd backend
npm start            # node index.js (no hot reload)
```

### Deployment Notes

| Concern | Recommendation |
|---------|----------------|
| PDF storage | Mount a persistent volume for `backend/rag-uploads/` |
| CORS | Restrict origins in production (currently open for local development) |
| Secrets | Use environment variables — never commit `.env` files |
| Chatbot KB | Run `/api/chatbot/ingest` after each knowledge-base update |
| Gemini API | Monitor rate limits and costs in Google AI Studio |
| Frontend API URL | Set `VITE_API_BASE_URL` explicitly for each environment |

---

## 🔒 Security

This README documents **local development** and general production hygiene. Before publishing or deploying publicly, review the following:

| Area | Guidance |
|------|----------|
| **Secrets** | Never commit `.env`, API keys, JWT secrets, or database passwords. Use placeholders in docs and real values only in your deployment environment. |
| **Database** | Do not use privileged accounts (e.g. `root`) in production. Create a dedicated application user with least-privilege access. |
| **JWT** | Use a long, randomly generated `JWT_SECRET`. Rotate it if you suspect exposure. |
| **API keys** | Keep `GEMINI_API_KEY` server-side only (backend `.env`). Never expose it in frontend code or `VITE_*` variables. |
| **CORS** | Tighten allowed origins before production; the default setup is permissive for local development. |
| **File uploads** | PDFs are stored on the server filesystem. Validate size limits, scan uploads if required by your policy, and protect `rag-uploads/` from public HTTP access. |
| **Chatbot ingest** | Treat `POST /api/chatbot/ingest` as an administrative action, not a general user feature. |
| **Authentication** | Tokens are stored in browser `localStorage`. For higher-security deployments, consider httpOnly cookies and HTTPS-only transport. |

If you fork this repository, rotate any credentials you used during development before going public.

---

## 🗺 Roadmap & Known Limitations

- [ ] Add `chatbot_chunks` table to `schema.sql` (currently a manual SQL step)
- [ ] Create `.env.example` files for both packages
- [ ] Expand Vitest coverage and shared test setup
- [ ] Docker / CI pipeline for automated builds
- [ ] Auto-ingest chatbot KB on server startup (optional flag)
- [ ] Instructor/cohort-level shared document corpora
- [ ] Harden chatbot ingest authorization for multi-tenant production

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please follow the existing code patterns:
- Backend: `routes → controller → service` with `express-validator`
- Frontend: domain services in `src/services/`, CSS Modules for styling
- Keep shell chrome in sync via `config/navConfig.js` when adding protected pages
- Match naming conventions and keep diffs focused

---

## 📄 License

This project is built for **educational use** as part of the Evangadi Networks Full Stack program (Phase 5).

---

<div align="center">

**Built with ❤️ for Evangadi Networks learners**

*Post with context · Search by meaning · Answer with evidence*

</div>
