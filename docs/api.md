# REST API Reference

All requests must send and accept JSON payloads (with the exception of verification redirects).

---

## Authentication

### 1. Register User
- **Method**: `POST`
- **Path**: `/api/auth/signup`
- **Auth Required**: No (Rate-limited to 15 requests per 15 minutes)
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword123",
    "displayName": "Jane Doe"
  }
  ```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "user": {
        "email": "user@example.com",
        "displayName": "Jane Doe",
        "role": "user"
      }
    }
    ```
  - `400 Bad Request`: `{"error": {"message": "All fields are required."}}`
  - `409 Conflict`: `{"error": {"message": "Email address already registered."}}`

### 2. Login User
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Auth Required**: No (Rate-limited to 15 requests per 15 minutes)
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword123"
  }
  ```
- **Responses**:
  - `200 OK`: Sets `access_token` and `refresh_token` httpOnly cookies.
    ```json
    {
      "user": {
        "email": "user@example.com",
        "displayName": "Jane Doe",
        "role": "user"
      }
    }
    ```
  - `401 Unauthorized`: `{"error": {"message": "Invalid email or password."}}`

### 3. Logout User
- **Method**: `POST`
- **Path**: `/api/auth/logout`
- **Auth Required**: No
- **Responses**:
  - `200 OK`: Clears cookie headers.
    ```json
    { "message": "Logged out successfully." }
    ```

### 4. Create Guest Session
- **Method**: `POST`
- **Path**: `/api/auth/guest`
- **Auth Required**: No
- **Responses**:
  - `200 OK`: Sets `guest_token` cookie.
    ```json
    { "message": "Guest session initialized successfully." }
    ```

---

## User Dashboard & Profile

### 1. Fetch Dashboard Stats
- **Method**: `GET`
- **Path**: `/api/dashboard`
- **Auth Required**: Yes (Must be user type)
- **Responses**:
  - `200 OK`:
    ```json
    {
      "profile": {
        "displayName": "Jane Doe",
        "totalXp": 450,
        "currentLevel": 4,
        "currentStreak": 3,
        "longestStreak": 12
      },
      "stats": {
        "totalAttempts": 15,
        "avgScore": 82.5,
        "maxScore": 100
      }
    }
    ```

### 2. Update Profile Settings
- **Method**: `PUT`
- **Path**: `/api/users/profile`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "displayName": "Jane updated",
    "leaderboardOptIn": false
  }
  ```
- **Responses**:
  - `200 OK`: `{"message": "Profile updated successfully."}`

---

## Quiz Engine & Attempts

### 1. Create Attempt
- **Method**: `POST`
- **Path**: `/api/attempts`
- **Auth Required**: Yes (Accepts user or guest cookies)
- **Request Body**:
  ```json
  {
    "categoryId": 1,
    "topicId": 2,
    "difficulty": "medium",
    "questionCount": 5,
    "quizMode": "assessment"
  }
  ```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "attemptId": "426fcd92-5eb3-4df4-8d96-b33342ff14c5",
      "questionCount": 5
    }
    ```

### 2. Fetch Active Question
- **Method**: `GET`
- **Path**: `/api/attempts/:id`
- **Auth Required**: Yes
- **Responses**:
  - `200 OK`:
    ```json
    {
      "attemptId": "426fcd92...",
      "status": "in_progress",
      "currentQuestionIndex": 0,
      "question": {
        "id": "question-uuid",
        "questionText": "What is 2 + 2?",
        "options": [
          { "id": "a", "text": "3" },
          { "id": "b", "text": "4" }
        ],
        "hint": "Think about arithmetic.",
        "fiftyFiftyUsed": false,
        "hintUsed": false,
        "flagged": false
      }
    }
    ```

### 3. Save Question Draft (Auto-save)
- **Method**: `POST`
- **Path**: `/api/attempts/:id/answers`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "attemptQuestionId": "question-uuid",
    "selectedOptionId": "b"
  }
  ```
- **Responses**:
  - `200 OK`: `{"message": "Draft saved successfully."}`

### 4. Submit Attempt
- **Method**: `POST`
- **Path**: `/api/attempts/:id/submit`
- **Auth Required**: Yes
- **Responses**:
  - `200 OK`:
    ```json
    {
      "message": "Quiz submitted successfully.",
      "results": {
        "attemptId": "426fcd92...",
        "totalScore": 5.00,
        "maxScore": 5,
        "percentage": 100.00,
        "xpEarned": 50,
        "timeTakenSeconds": 45
      }
    }
    ```
