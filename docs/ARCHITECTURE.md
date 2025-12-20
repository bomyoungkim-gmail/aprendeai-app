# AprendeAI Platform Architecture

**Version:** 1.0.0 (Production Ready)  
**Date:** December 2025

## 🏗️ High-Level Architecture

AprendeAI is built on a modern, event-driven microservices architecture designed for scalability, real-time interaction, and AI data processing.

```mermaid
graph TD
    User[Users/Clients]

    subgraph Frontend_Layer
        Web[Next.js PWA]
        Mobile[Mobile View]
    end

    subgraph Gateway_Layer
        API[NestJS API Gateway]
        WS[WebSocket Gateway]
    end

    subgraph Core_Services
        Auth[Auth Service]
        Content[Content Management]
        Study[Study & Review]
        Social[Social/Groups]
        Gamification[Gamification Engine]
    end

    subgraph AI_Processing_Layer
        AIService[Python AI Service]
        Queue[BullMQ / Redis]

        Ingestor[Content Ingestor Worker]
        Processor[Content Processor Worker]
        Extractor[Extraction Worker]
    end

    subgraph Data_Persistence
        Postgres[(PostgreSQL Primary DB)]
        Redis[(Redis Cache & Session)]
        VectorDB[(pgvector Embeddings)]
        Storage[File Storage]
    end

    %% Connections
    User -->|HTTPS/WSS| Web
    Web -->|REST| API
    Web -->|Socket.io| WS

    API -->|Auth| Auth
    API -->|CRUD| Postgres
    API -->|Quick Access| Redis
    API -->|Async Jobs| Queue

    WS -->|Realtime| API
    WS -->|PubSub| Redis

    Queue --> Ingestor
    Queue --> Processor
    Queue --> Extractor

    Processor -->|LLM Requests| AIService
    Processor -->|Store Assets| Storage
    Processor -->|Update Status| API

    AIService -->|Embeddings| VectorDB
```

---

## 🧩 Core Components

### 1. Frontend Application

- **Framework:** Next.js 14 (App Router)
- **State Management:** Zustand + React Query
- **Styling:** Tailwind CSS + Lucide Icons
- **Real-time:** Socket.io Client
- **PWA:** Service Workers, Manifest, Offline Capability

### 2. API Gateway (Backend)

- **Framework:** NestJS (Node.js)
- **Role:** Central entry point, authentication, orchestration
- **Modules:**
  - `AuthModule`: JWT strategies, Guards, OAuth
  - `ContentModule`: Uploads, metadata, organization
  - `ReviewModule`: SRS logic, flashcards
  - `GroupsModule`: Collaboration, chat
  - `ActivityModule`: Heatmaps, stats tracking

### 3. AI Service (Python)

- **Framework:** FastAPI
- **Dependencies:** LangChain, OpenAI/Anthropic SDKs
- **Capabilities:**
  - Content Summarization
  - Flashcard Generation (JSON Mode)
  - Quiz Generation
  - Semantic Search (Embeddings)
  - Audio Transcription (Whisper)

### 4. Background Workers

- **Queue System:** BullMQ (Redis-based)
- **Worker Types:**
  - `news-ingestor`: Fetches RSS/API feeds
  - `arxiv-ingestor`: Processes academic papers
  - `content-processor`: Orchestrates AI pipelines
  - `extraction-worker`: OCR and text extraction from binaries

---

## 🔄 Critical Data Flows

### A. Content Upload & Processing Pipeline

This flow describes how a raw file (PDF, Video) becomes learnable material.

```mermaid
sequenceDiagram
    participant U as User
    participant API as API Gateway
    participant Q as Job Queue
    participant W as Processor Worker
    participant AI as AI Service
    participant DB as Database

    U->>API: Upload File (PDF/MP4)
    API->>DB: Create Content Entry (PENDING)
    API->>Q: Add 'process-content' Job
    API-->>U: 202 Accepted

    Q->>W: Process Job

    alt Text Content
        W->>W: Extract Text
    else Media Content
        W->>AI: Request Transcription (Whisper)
        AI-->>W: Transcript Text
    end

    W->>W: Chunk Text
    W->>DB: Save Transcript/Chunks

    par Parallel AI Tasks
        W->>AI: Generate Summary
        W->>AI: Generate Flashcards
        W->>AI: Generate Initial Quiz
        W->>AI: Generate Embeddings
    end

    AI-->>W: AI Assets
    W->>DB: Save All Assets
    W->>DB: Update Status (READY)
    W->>API: Emit WebSocket Event
    API-->>U: Toast Notification "Content Ready"
```

### B. Spaced Repetition (SRS) Algorithm Flow

How the system queues and reschedules reviews.

```mermaid
flowchart LR
    Start([User Review Session]) --> Fetch{Get Due Cards}
    Fetch -->|Query SRS Queue| DB[(Database)]
    DB -->|Due Items| Display[Display Card]

    Display --> Response{User Grade}

    Response -->|Again 1| FSRS[FSRS Algo]
    Response -->|Hard 2| FSRS
    Response -->|Good 3| FSRS
    Response -->|Easy 4| FSRS

    FSRS --> Calc[Calculate Next Interval]
    Calc --> Update[Update Card Stability/Difficulty]
    Update --> Schedule[Schedule Next Review Date]
    Schedule --> DB
```

---

## 💾 Data Model (ER Diagram)

Key entity relationships powering the platform.

```mermaid
erDiagram
    User ||--o{ Content : creates
    User ||--o{ Session : takes
    User ||--o{ ReviewLog : generates
    User ||--o{ GroupMember : belongs_to

    Content ||--o{ Flashcard : contains
    Content ||--o{ Quiz : contains
    Content ||--o{ Annotation : has
    Content ||--o{ Session : scaffolds

    Session ||--o{ SessionEvent : tracks

    StudyGroup ||--o{ GroupMember : has
    StudyGroup ||--o{ Content : shares
    StudyGroup ||--o{ GroupSession : hosts

    Flashcard ||--o{ ReviewItem : srs_state
    ReviewItem ||--o{ ReviewLog : history
```

---

## 🛠️ Infrastructure Stack

| Layer        | Technology          | Purpose                        |
| ------------ | ------------------- | ------------------------------ |
| **Compute**  | Docker / K8s        | Container orchestration        |
| **Database** | PostgreSQL 16       | ACID compliant primary store   |
| **Caching**  | Redis 7             | Job queues, caching, PubSub    |
| **Search**   | pgvector            | Vector similarity search       |
| **Storage**  | S3 / MinIO          | Binary file storage            |
| **AI LLM**   | GPT-4o / Claude 3.5 | Logic & generation             |
| **AI Audio** | Whisper             | Speech-to-text                 |
| **CI/CD**    | GitHub Actions      | Automated testing & deployment |

---

## 🔐 Security & Compliance

1. **Authentication:**

   - JWT (Access + Refresh tokens)
   - OAuth 2.0 (Google, Microsoft integration)
   - Password Hashing (Argon2)

2. **Authorization:**

   - RBAC (Role-Based Access Control)
   - Resource Ownership Guards (User can only access their own data)

3. **Data Protection:**
   - Transmit encryption (TLS 1.3)
   - Database encryption at rest attempt
   - Secure HttpOnly Cookies for tokens

---

## 📈 Scalability Strategy

- **Horizontal Scaling:** API Gateway is stateless; multiple instances can run behind a load balancer.
- **Worker Scaling:** Processing workers can be scaled independently based on queue depth.
- **Read Replicas:** Database read replicas for heavy read operations (Flashcard retrieval).
- **CDN:** Static assets and generated media served via CDN edges.
