# Database Schema Overview

**Purpose:** Document Prisma data model and key relationships  
**Audience:** Dev | Antigravity  
**Last updated:** 2025-12-18  
**Owner:** Engineering Team

## Invariants (cannot break)

- `User.email` is unique
- `Content.userId` references valid user (owner)
- `ReadingSession.phase` follows PRE→DURING→POST→FINISHED
- `UserVocabulary.srsStage` must be valid SRS enum
- `CornellNote` has 1:1 with Content+User+Session combo
- All timestamps use DateTime (UTC)

## Scope

**In scope:**

- Core entities (User, Content, Session, Cornell, Vocab)
- Key relationships
- Enums and constraints
- Indexes for performance

**Out of scope:**

- Migration details (see 01-migrations.md)
- Sample data (see 02-sample-data.md)
- Query optimization (see system-design)

## Core Entities

### User & Profile

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  emailVerified DateTime?

  profile       LearnerProfile?
  contents      Content[]
  sessions      ReadingSession[]
  vocab         UserVocabulary[]
}

model LearnerProfile {
  userId          String @id
  user            User   @relation(fields: [userId], references: [id])
  dailyReviewCap  Int    @default(20)
  targetLanguage  String @default("PT")
}
```

**Key points:**

- One profile per user
- `dailyReviewCap` limits SRS queue size
- `targetLanguage` for translations

---

### Content & Chunks

```prisma
model Content {
  id               String         @id @default(cuid())
  userId           String
  user             User           @relation(fields: [userId], references: [id])

  title            String
  type             ContentType    // PDF, DOCX, IMAGE, TEXT
  originalLanguage String
  rawText          String         @db.Text

  chunks           ContentChunk[]
  sessions         ReadingSession[]
  cornellNotes     CornellNote[]

  createdAt        DateTime       @default(now())
}

model ContentChunk {
  id         String  @id @default(cuid())
  contentId  String
  content    Content @relation(fields: [contentId], references: [id])

  chunkIndex Int
  text       String  @db.Text
  embedding  Float[] // Vector for semantic search

  @@unique([contentId, chunkIndex])
}
```

**Key points:**

- Content can be PDF, DOCX, IMAGE, or TEXT
- Chunks enable pagination and semantic search
- `chunkIndex` maintains order

---

### Sessions & Events

```prisma
model ReadingSession {
  id          String        @id @default(cuid())
  userId      String
  user        User          @relation(fields: [userId], references: [id])
  contentId   String
  content     Content       @relation(fields: [contentId], references: [id])

  phase       SessionPhase  // PRE, DURING, POST, FINISHED
  modality    String        @default("READING") // READING, LISTENING

  preGoal     String?
  preTargetWords Json?
  prePredictions String?

  events      SessionEvent[]
  outcome     SessionOutcome?

  startedAt   DateTime      @default(now())
  finishedAt  DateTime?
}

model SessionEvent {
  id         String         @id @default(cuid())
  sessionId  String
  session    ReadingSession @relation(fields: [sessionId], references: [id])

  eventType  String         // QUIZ_RESPONSE, MARK_UNKNOWN_WORD, etc.
  payloadJson Json

  createdAt  DateTime       @default(now())
}

model SessionOutcome {
  id                  String         @id @default(cuid())
  sessionId           String         @unique
  session             ReadingSession @relation(fields: [sessionId], references: [id])

  comprehensionScore  Int
  productionScore     Int
  frustrationIndex    Int
  timeSpent           Int            // minutes
  wordsLearned        Int

  calculatedAt        DateTime       @default(now())
}
```

**Key points:**

- Sessions track 4-phase flow
- Events store all user interactions (quiz, production, etc.)
- Outcomes calculated once at FINISHED

---

### Cornell Notes

```prisma
model CornellNote {
  id              String   @id @default(cuid())
  userId          String
  contentId       String
  readingSessionId String?

  mainNotes       Json     @default("{}")    // { "1": "note", "2": "note" }
  cueColumn       String?  @db.Text
  summaryText     String?  @db.Text

  highlights      CornellHighlight[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, contentId, readingSessionId])
}

model CornellHighlight {
  id              String      @id @default(cuid())
  cornellNoteId   String
  cornellNote     CornellNote @relation(fields: [cornellNoteId], references: [id])

  highlightedText String
  anchorJson      Json        // Page coords for PDF, paragraph for DOCX, etc.
  linkedNoteId    String?     // Link to mainNotes key
  color           String?
  type            String?     // DEFINITION, EXAMPLE, IMPORTANT

  createdAt       DateTime    @default(now())
}
```

**Key points:**

- One cornell note per (user, content, session) combo
- `mainNotes` is JSON for flexibility
- Highlights link text to notes

---

### Vocabulary & SRS

```prisma
model UserVocabulary {
  id           String       @id @default(cuid())
  userId       String
  user         User         @relation(fields: [userId], references: [id])
  contentId    String

  word         String
  language     String
  srsStage     SrsStage     // NEW, D1, D3, D7, D14, D30, D60, MASTERED
  dueAt        DateTime
  lapseCount   Int          @default(0)
  masteryScore Int          @default(0)

  attempts     VocabAttempt[]

  lastReviewedAt DateTime?
  createdAt      DateTime   @default(now())

  @@unique([userId, word, language])
  @@index([userId, dueAt])  // For queue queries
}

model VocabAttempt {
  id          String         @id @default(cuid())
  userId      String
  vocabItemId String
  vocabItem   UserVocabulary @relation(fields: [vocabItemId], references: [id])

  result      AttemptResult  // FAIL, HARD, OK, EASY

  attemptedAt DateTime       @default(now())
}

enum SrsStage {
  NEW
  D1
  D3
  D7
  D14
  D30
  D60
  MASTERED
}

enum AttemptResult {
  FAIL
  HARD
  OK
  EASY
}
```

**Key points:**

- One vocab item per (user, word, language)
- `srsStage` drives spaced repetition
- Index on `(userId, dueAt)` for fast queue queries
- Attempts track review history

---

## Key Relationships

**1:N Relationships:**

- User → Contents (one user, many contents)
- User → Sessions (one user, many sessions)
- Content → Chunks (one content, many chunks)
- Content → Sessions (one content, many sessions)
- Session → Events (one session, many events)

**1:1 Relationships:**

- Session → Outcome (one session, one outcome)
- User → LearnerProfile (one user, one profile)

**Composite Unique:**

- CornellNote: (userId, contentId, sessionId)
- UserVocabulary: (userId, word, language)
- ContentChunk: (contentId, chunkIndex)

## Indexes for Performance

**Critical queries:**

```prisma
// SRS queue
@@index([userId, dueAt]) on UserVocabulary

// Session lookup
@@index([userId, contentId]) on ReadingSession

// Event filtering
@@index([sessionId, eventType]) on SessionEvent
```

## Enums

```prisma
enum SessionPhase {
  PRE
  DURING
  POST
  FINISHED
}

enum ContentType {
  PDF
  DOCX
  IMAGE
  TEXT
}
```

## Related docs

- [Migrations](./01-migrations.md)
- [SRS System](../../02-business-rules/02-srs.md)
- [Study Sessions](../../02-business-rules/01-study-sessions.md)
- [API Contracts](../../05-api/01-rest-contracts.md)

## Implementation

**File:** `services/api/prisma/schema.prisma`

**To regenerate client:**

```bash
npx prisma generate
```

**To create migration:**

```bash
npx prisma migrate dev --name description
```
