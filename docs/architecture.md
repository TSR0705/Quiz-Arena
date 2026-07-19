# System Architecture

This document maps the architectural interfaces, component lifecycles, and backend integrations of QuizArena.

---

## High-Level System Overview

```mermaid
graph TD
    Client[React Frontend SPA] -->|JSON Requests / Cookies| Router[Vercel Router / Rewriter]
    Router -->|/api/*| Express[Express Serverless Handler]
    Router -->|/*| Static[Vite Static Compilation /dist]
    
    subgraph Express Backend
        Express --> Middleware[Auth & Rate Limit Middlewares]
        Middleware --> Controllers[REST API Controllers]
        Controllers --> Services[Email & Scoring Services]
    end
    
    subgraph Data & Integrations
        Controllers --> DB[(Neon Serverless PostgreSQL)]
        Services --> SendGrid[SendGrid REST API v3]
    end
```

---

## Feature Workflows

### 1. Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant Auth as AuthController
    participant DB as Postgres Database
    
    User->>Auth: POST /api/auth/login {email, password}
    Auth->>DB: Query User by email
    DB-->>Auth: Returns password_hash & role
    Auth->>Auth: Validate password using bcrypt.compare()
    Auth->>DB: Issue & store SHA256 hashed refresh token
    Auth-->>User: Set httpOnly Cookie: access_token & refresh_token
```

### 2. Quiz Attempt Engine

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant Attempt as AttemptController
    participant DB as Postgres Database
    
    User->>Attempt: POST /api/attempts {topicId, difficulty, count}
    Attempt->>DB: Fetch random active questions matching filters
    DB-->>Attempt: Questions list
    Attempt->>DB: Insert record into quiz_attempts & attempt_questions
    Attempt-->>User: Return attemptId & first question structure
    
    Note over User, Attempt: During quiz execution:
    User->>Attempt: POST /api/attempts/:id/answers {questionId, selectedOptionId}
    Attempt->>DB: Upsert attempt_answers (Auto-save)
    Attempt-->>User: Save acknowledged
```

### 3. Certificate Issuance & Verification

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant Cert as CertificateController
    participant DB as Postgres Database
    
    User->>Cert: POST /api/certificates {attemptId}
    Cert->>DB: Query quiz_attempt results
    DB-->>Cert: Returns status, percentage, question_count
    Cert->>Cert: Assert percentage == 100 & count >= 5
    Cert->>DB: Insert certificate & generate verification_code
    Cert-->>User: Return certificate code
    
    Note over User, Cert: Third-Party Public Verification:
    actor Guest as External Guest
    Guest->>Cert: GET /api/certificates/verify/:code
    Cert->>DB: Query certificate join users & quiz_attempts
    DB-->>Cert: Certificate payload
    Cert-->>Guest: Return public JSON verification status
```

### 4. Leaderboard Calculation

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant Leader as LeaderboardController
    participant DB as Postgres Database
    
    User->>Leader: GET /api/leaderboard?topicId=X&difficulty=Y
    Leader->>DB: Query quiz_attempts filtered, ordered by score (DESC), time (ASC)
    DB-->>Leader: Ordered rows
    Leader-->>User: Ranked JSON array
```

### 5. Password Reset Request

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant Auth as AuthController
    participant DB as Postgres Database
    participant Email as SendGrid Service
    
    User->>Auth: POST /api/auth/forgot-password {email}
    Auth->>DB: Query user exists by email
    DB-->>Auth: User record
    Auth->>DB: Insert password_reset token hash with expiration
    Auth->>Email: Fetch SendGrid v3 REST Mail endpoint
    Email-->>User: Dispatch reset link email
    Auth-->>User: Operation status message
```
