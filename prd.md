# QuizArena Product Requirements Document

Status: Draft for completion planning
Created: 2026-07-14
Source baseline: Current React/Vite project plus `PROJECT_AUDIT.md`

## 1. Product Overview

QuizArena is an interactive quiz learning platform where users can choose a subject, choose a topic, select quiz difficulty, answer timed questions, receive instant feedback, track performance, earn XP and badges, and compare scores on leaderboards.

The current project is a front-end prototype. It has a landing page, category selection UI, a local quiz-taking flow, a completion screen, and 3D visual elements. The remaining work is to turn the prototype into a real product by adding real question data, persistence, authentication, backend APIs, admin/content tooling, reliable scoring, production-quality routing, tests, accessibility, and deployment readiness.

## 2. Current State

### 2.1 What Exists Now

- React/Vite single page application.
- Tailwind-based dark theme.
- 3D hero/visual assets using Three/Fiber and GLTF models.
- Landing sections: navbar, hero, about, testimonials, auth form, footer.
- Quiz category selection with search, pagination, topic selection, difficulty, and number of questions.
- Quiz-taking UI with timer, answer selection, hints, 50/50, flagging, review screen, XP, points, badges, comments, ratings, issue reporting, and toast feedback.
- Completion page with score summary, basic analytics, wrong-answer review, mock leaderboard, share link, restart, and back navigation.

### 2.2 What Is Fake Or Incomplete Now

- Quiz questions are generated mock text.
- Every generated question has the same answer: `Option A`.
- No real database or content source exists.
- No backend APIs exist.
- No authentication exists; login/signup/reset/contact are simulated with alerts.
- No persistence exists for attempts, answers, XP, streaks, badges, issue reports, or comments.
- Leaderboards are hard-coded mock arrays.
- Certificate generation is a placeholder link.
- Newsletter subscription is simulated.
- Testimonials and social proof are static marketing placeholders.
- Multiple routes are missing even though links point to them.
- Current build verification is blocked by local OneDrive/file-provider issues and esbuild access issues.

### 2.3 Product Completion Goal

Completion means QuizArena can be used by a real student/user to:

1. Create an account or continue as a guest.
2. Select a real quiz category, topic, difficulty, and question count.
3. Take a quiz from real question content.
4. Receive accurate scoring, timing, explanations, and result analytics.
5. Save quiz attempts to a profile.
6. Resume or review previous attempts.
7. Compete on a real leaderboard.
8. Report poor questions or content issues.
9. Use the app reliably on desktop and mobile.
10. Run in production with documented setup, tests, credits, and deployment process.

## 3. Vision And Objectives

### 3.1 Vision

Make QuizArena a credible learning-and-practice platform that feels engaging like a game but remains useful as an academic practice tool.

### 3.2 Primary Objectives

- Replace the prototype's mock logic with real quiz data and reliable scoring.
- Build a stable MVP that can be launched and demonstrated end to end.
- Add user accounts and progress tracking.
- Add maintainable content management for quiz questions.
- Add leaderboards and badges that are based on actual attempts.
- Remove misleading placeholder claims.
- Make the codebase clean, testable, deployable, and documented.

### 3.3 Non-Goals For Initial Completion

- Real-time multiplayer quiz battles.
- Paid subscriptions.
- AI-generated questions in production.
- Native mobile apps.
- Full classroom/teacher management suite.
- Advanced anti-cheat/proctoring.
- Highly complex adaptive learning algorithms.

These can be considered after the core product is real and stable.

## 4. Target Users

### 4.1 Primary User: Student Learner

Needs:

- Practice topics quickly.
- Know correct answers and explanations.
- Track progress over time.
- Repeat weak topics.
- Use the app on mobile and desktop.

Success criteria:

- Can start a quiz in under 60 seconds.
- Can understand why an answer is correct.
- Can see performance history and weak areas.

### 4.2 Secondary User: Competitive Learner

Needs:

- Earn points, XP, streaks, levels, and badges.
- Compare scores with other users.
- Share achievements.

Success criteria:

- Leaderboards reflect real scores.
- Rewards are consistent and not easily inflated.
- Sharing is optional and does not block quiz use.

### 4.3 Admin/Content Maintainer

Needs:

- Add/edit/delete quiz questions.
- Assign questions to categories, topics, and difficulties.
- Review reported issues.
- Disable bad questions.

Success criteria:

- Can publish a corrected question without editing source code.
- Can see issue reports tied to specific questions and attempts.

## 5. Product Scope

### 5.1 MVP Scope

The MVP is the first complete, usable version. It must include:

- Stable routing.
- Real quiz question source.
- Category/topic/difficulty/question-count selection.
- Timed quiz-taking experience.
- Accurate scoring.
- Review screen before final submission.
- Completion page with analytics.
- Guest mode with local attempt summary.
- User account mode with saved attempt history.
- Basic leaderboard.
- Question issue reporting.
- README and asset credits.
- Successful production build.

### 5.2 Version 1 Scope

Version 1 extends MVP with:

- Admin question management UI.
- User dashboard.
- Persistent XP, levels, badges, streaks.
- Better leaderboard filters.
- Certificate generation.
- Email/contact/newsletter integration or removal of those UI claims.
- Accessibility and mobile polish.
- Full automated test coverage for core flows.

### 5.3 Future Scope

- Classroom groups.
- Friends leaderboard.
- Quiz recommendations.
- Adaptive difficulty.
- Question import/export.
- Public profile pages.
- Analytics dashboard for admins.
- Multiplayer modes.

## 6. User Journeys

### 6.1 Guest Quiz Journey

1. User lands on home page.
2. User clicks Start Quiz.
3. User selects category, topic, difficulty, and number of questions.
4. User starts quiz.
5. User answers questions with timer running.
6. User can use hint or 50/50 once per question.
7. User can flag questions for review.
8. User reaches review screen.
9. User submits quiz.
10. User sees results, explanations, timing, and weak topics.
11. User can restart, choose another quiz, or create account to save progress.

Acceptance criteria:

- User can complete this journey without signing in.
- Guest attempt is held locally for the session.
- No fake account or fake leaderboard claims are shown as real.

### 6.2 Registered User Journey

1. User signs up or logs in.
2. User selects and takes quiz.
3. Attempt is saved to account.
4. XP, level, streaks, and badges update.
5. User sees dashboard/history.
6. User can review past attempts.
7. User can appear on leaderboard if eligible.

Acceptance criteria:

- Refreshing the browser does not lose saved progress.
- Logout and login restore the same account history.
- Invalid login/signup states show clear errors.

### 6.3 Admin Content Journey

1. Admin logs in.
2. Admin opens question management.
3. Admin creates category/topic if needed.
4. Admin creates or edits questions.
5. Admin sets difficulty and explanation.
6. Admin publishes question.
7. Admin reviews issue reports and disables/fixes bad content.

Acceptance criteria:

- Admin-only actions are protected.
- Non-admin users cannot access admin endpoints.
- Changes appear in quiz selection without code deployment.

## 7. Functional Requirements

### 7.1 Routing And App Structure

FR-001: The app must have clear page-level routes.

Required routes:

- `/` home/landing
- `/quizzes` quiz selection
- `/quiz/:attemptId` quiz-taking page
- `/results/:attemptId` quiz completion/results page
- `/login`
- `/signup`
- `/forgot-password`
- `/dashboard`
- `/leaderboard`
- `/admin/questions`
- `/privacy`
- `/terms`

FR-002: Quiz-taking and result routes must not render landing-page hero/about/testimonials around the quiz UI.

FR-003: Undefined routes must show a 404 page with a link back home.

FR-004: Hash links in the navbar must work only for sections that exist on the current page.

Current code impacted:

- `src/App.jsx`
- `src/components/Navbar.jsx`
- `src/components/Hero.jsx`
- `src/components/Footer.jsx`

### 7.2 Quiz Catalog

FR-010: System must store quiz categories.

Category fields:

- `id`
- `name`
- `slug`
- `description`
- `icon`
- `isActive`
- `createdAt`
- `updatedAt`

FR-011: System must store topics under categories.

Topic fields:

- `id`
- `categoryId`
- `name`
- `slug`
- `description`
- `isActive`

FR-012: User must be able to search categories and topics.

FR-013: Pagination must be based on filtered results, not total unfiltered results.

FR-014: Selecting a new category must reset previous selected topic.

FR-015: Topic is required before starting a quiz.

FR-016: Difficulty is required and must be one of:

- `easy`
- `medium`
- `hard`

FR-017: Question count must be an integer within allowed range.

Initial allowed range:

- Minimum: 1
- Maximum: 50
- Default: 5

### 7.3 Question Bank

FR-020: System must store real questions.

Question fields:

- `id`
- `categoryId`
- `topicId`
- `difficulty`
- `questionText`
- `questionType`
- `options`
- `correctAnswer`
- `hint`
- `explanation`
- `source`
- `status`
- `createdBy`
- `reviewedBy`
- `createdAt`
- `updatedAt`

FR-021: MVP question type must support single-choice multiple choice.

FR-022: Future question types may include multi-select, true/false, text input, and image-based questions.

FR-023: Each published question must have:

- Non-empty question text.
- At least 4 answer options.
- Exactly one correct answer for single-choice.
- Explanation.
- Category and topic.
- Difficulty.

FR-024: The app must never generate fake question text in production.

FR-025: If insufficient questions exist for a selected quiz, the user must see a clear message before starting.

FR-026: Question order should be randomized per attempt.

FR-027: Option order should be randomized per attempt unless disabled for a specific question.

### 7.4 Quiz Attempt Creation

FR-030: Starting a quiz must create an attempt.

Attempt fields:

- `id`
- `userId` nullable for guest
- `categoryId`
- `topicId`
- `difficulty`
- `questionCount`
- `status`
- `startedAt`
- `submittedAt`
- `timeLimitPerQuestion`
- `totalScore`
- `xpEarned`
- `levelAfterAttempt`

FR-031: Attempt status must be one of:

- `in_progress`
- `submitted`
- `abandoned`

FR-032: Attempt must store the exact selected questions.

FR-033: Attempt must not change if questions are later edited.

FR-034: Guest attempts may be stored in browser storage until user signs up or session expires.

FR-035: Registered attempts must be stored server-side.

### 7.5 Quiz Taking

FR-040: User must see one question at a time.

FR-041: User must see progress indicator.

FR-042: User must see question navigation buttons.

FR-043: User must be able to go previous/next while attempt is in progress.

FR-044: User must be able to jump to a question from the question index.

FR-045: User must be able to flag/unflag questions.

FR-046: User must be able to submit an answer.

FR-047: User must not be able to submit the same answer twice for scoring.

FR-048: User must see immediate feedback after answer submission if quiz mode allows it.

FR-049: Timer must count down reliably.

FR-050: If time expires, the current question must be auto-submitted as unanswered or timed out.

FR-051: User must be able to use one hint per question if hint exists.

FR-052: User must be able to use 50/50 once per eligible question.

FR-053: Lifeline usage must be stored with the answer record.

FR-054: Keyboard shortcuts must be accessible and safe when question data is loading.

FR-055: The quiz page must handle refresh gracefully.

MVP refresh behavior:

- Registered user: restore in-progress attempt.
- Guest user: restore from local storage if available, otherwise show recovery message.

### 7.6 Scoring

FR-060: System must score each answer based on stored correct answer for the attempt snapshot.

FR-061: Correct single-choice answer gives base points.

Suggested MVP scoring:

- Correct answer: 1 point
- Wrong answer: 0 points
- Unanswered/timed out: 0 points
- Hint used: -0.25 point, floor question score at 0
- 50/50 used: -0.25 point, floor question score at 0
- Fast answer bonus: +0.25 point if correct under configured threshold
- Streak bonus: +1 point after every 3 consecutive correct answers

FR-062: Scoring rules must be centralized in a pure function.

FR-063: UI must display scoring rules or make penalties clear before use.

FR-064: Final score must be reproducible from answer records.

FR-065: XP must be derived from attempt performance.

Suggested MVP XP:

- 10 XP per correct answer
- 5 XP completion bonus
- Additional badge bonuses do not change score

### 7.7 Review And Completion

FR-070: Before final submission, user must see review screen.

Review screen must show:

- Answered questions
- Unanswered questions
- Flagged questions
- Timed-out questions

FR-071: User can return to any question before final submit.

FR-072: Final submit locks the attempt.

FR-073: Completion page must show:

- Correct count
- Incorrect count
- Unanswered count
- Total score
- Percentage
- XP earned
- Badges earned
- Time taken
- Topic/subtopic breakdown
- Wrong answers with explanations
- Unanswered questions with explanations

FR-074: Completion analytics must not rely on `Object.values(answers)` index ordering.

FR-075: User can restart same quiz settings.

FR-076: User can return to quiz selection.

### 7.8 Authentication

FR-080: User must be able to sign up.

Required signup fields:

- Username/display name
- Email
- Password
- Confirm password

FR-081: User must be able to log in.

FR-082: User must be able to log out.

FR-083: User must be able to request password reset.

FR-084: System must show validation errors.

FR-085: Password handling must be delegated to secure auth provider or secure backend hashing.

FR-086: Auth state must be persisted securely.

FR-087: App must distinguish guest, user, and admin roles.

FR-088: Current fake alert-based auth must be removed.

### 7.9 User Dashboard

FR-090: Registered user must have dashboard.

Dashboard must show:

- Profile summary
- Total attempts
- Average score
- Highest score
- Recent attempts
- XP
- Level
- Badges
- Streaks
- Weak topics

FR-091: User can open past attempt results.

FR-092: Dashboard must not use sample localStorage history.

FR-093: Guest users must be prompted to sign up to save history.

### 7.10 Leaderboards

FR-100: System must provide real leaderboard data.

Leaderboard filters:

- Global
- Category
- Topic
- Difficulty
- Time period: daily, weekly, all-time

FR-101: Leaderboards must be based on submitted attempts only.

FR-102: Leaderboard entry must include:

- Rank
- Display name
- Score
- XP or points
- Attempt date
- Category/topic/difficulty

FR-103: Users can opt out of public leaderboard display.

FR-104: Fake `User1`, `Friend1`, and `Student1` entries must be removed.

FR-105: Friends/classroom leaderboard must not be shown until friend/classroom systems exist.

### 7.11 Badges, XP, Levels, And Streaks

FR-110: System must persist XP, level, badges, and streaks.

FR-111: Badge rules must be centralized and documented.

Initial badge rules:

- `First Quiz`: Complete first quiz.
- `Speedy Thinker`: Correct answer under fast threshold 5 times.
- `Perfect Score`: 100 percent on a quiz with at least 5 questions.
- `Quiz Master`: Complete 10 quizzes.
- `Topic Specialist`: Score at least 80 percent on 5 attempts in same topic.

FR-112: Streaks must be based on calendar days, not component state.

FR-113: XP and level updates must be idempotent when result page reloads.

### 7.12 Question Feedback And Reporting

FR-120: User can rate a question after answering.

Rating options:

- Helpful
- Confusing
- Incorrect

FR-121: User can submit text issue report.

FR-122: Issue report must be linked to question, attempt, and user if available.

FR-123: Admin can review reports.

FR-124: Reported questions can be disabled or edited.

FR-125: Current comments/reports must not disappear after page refresh.

### 7.13 Admin Question Management

FR-130: Admin can create question.

FR-131: Admin can edit question.

FR-132: Admin can archive question.

FR-133: Admin can publish/unpublish question.

FR-134: Admin can filter questions by category, topic, difficulty, status, and report count.

FR-135: Admin can preview quiz as user.

FR-136: Admin actions must be logged.

### 7.14 Certificates And Sharing

FR-140: System may generate certificate only for completed registered attempts.

FR-141: Certificate must include:

- User display name
- Quiz category/topic
- Score
- Completion date
- Unique certificate ID
- Verification URL

FR-142: Placeholder certificate URL must be removed.

FR-143: Social sharing must use the actual production URL.

FR-144: Sharing must be optional.

FR-145: If certificates are not implemented by MVP, the button must be hidden.

### 7.15 Contact, Newsletter, And Marketing Claims

FR-150: Contact form must either send real messages or be removed.

FR-151: Newsletter must either store/send real subscriptions or be removed.

FR-152: Public contact details must be confirmed before launch.

FR-153: Social links must point to real owned profiles or be removed.

FR-154: Claims like "Join over 10,000 quiz enthusiasts" must be removed until true.

FR-155: Testimonials must be real with permission or replaced with generic product copy.

## 8. Data Requirements

### 8.1 Core Entities

#### User

- `id`
- `email`
- `displayName`
- `role`
- `avatarUrl`
- `leaderboardOptIn`
- `createdAt`
- `updatedAt`

#### Category

- `id`
- `name`
- `slug`
- `description`
- `icon`
- `isActive`

#### Topic

- `id`
- `categoryId`
- `name`
- `slug`
- `description`
- `isActive`

#### Question

- `id`
- `categoryId`
- `topicId`
- `difficulty`
- `questionType`
- `questionText`
- `optionsJson`
- `correctAnswerJson`
- `hint`
- `explanation`
- `source`
- `status`
- `createdBy`
- `reviewedBy`
- `createdAt`
- `updatedAt`

#### QuizAttempt

- `id`
- `userId`
- `guestSessionId`
- `categoryId`
- `topicId`
- `difficulty`
- `questionCount`
- `status`
- `startedAt`
- `submittedAt`
- `totalScore`
- `maxScore`
- `percentage`
- `xpEarned`
- `timeTakenSeconds`

#### AttemptQuestion

- `id`
- `attemptId`
- `questionId`
- `questionSnapshotJson`
- `position`
- `optionOrderJson`

#### AttemptAnswer

- `id`
- `attemptId`
- `attemptQuestionId`
- `selectedAnswerJson`
- `isCorrect`
- `pointsAwarded`
- `timeTakenSeconds`
- `hintUsed`
- `fiftyFiftyUsed`
- `flagged`
- `timedOut`
- `submittedAt`

#### Badge

- `id`
- `code`
- `name`
- `description`
- `icon`
- `ruleJson`

#### UserBadge

- `id`
- `userId`
- `badgeId`
- `earnedAt`
- `attemptId`

#### QuestionReport

- `id`
- `questionId`
- `attemptId`
- `userId`
- `reportType`
- `message`
- `status`
- `adminNotes`
- `createdAt`
- `resolvedAt`

### 8.2 Seed Content Requirement

MVP must include enough real questions to demonstrate value.

Minimum seed target:

- 5 categories.
- 5 topics per category.
- 20 questions per topic.
- 3 difficulty levels represented.

Minimum MVP question count:

- 500 real reviewed questions.

Launch-ready question count:

- 1,500+ real reviewed questions.

## 9. API Requirements

The exact backend technology can be chosen during implementation, but the product should support these API contracts.

### 9.1 Public Catalog APIs

`GET /api/categories`

- Returns active categories.

`GET /api/categories/:categoryId/topics`

- Returns active topics for category.

`GET /api/questions/count?topicId=&difficulty=`

- Returns available question count before quiz starts.

### 9.2 Attempt APIs

`POST /api/attempts`

Creates attempt.

Request:

- `categoryId`
- `topicId`
- `difficulty`
- `questionCount`

Response:

- `attemptId`
- selected question snapshots

`GET /api/attempts/:attemptId`

Returns attempt state.

`POST /api/attempts/:attemptId/answers`

Saves answer.

`POST /api/attempts/:attemptId/submit`

Finalizes and scores attempt.

`GET /api/attempts/:attemptId/results`

Returns result analytics.

### 9.3 User APIs

`GET /api/me`

Returns current user profile.

`GET /api/me/dashboard`

Returns user progress summary.

`GET /api/me/attempts`

Returns attempt history.

### 9.4 Leaderboard APIs

`GET /api/leaderboard`

Query params:

- `scope`
- `categoryId`
- `topicId`
- `difficulty`
- `period`

### 9.5 Question Feedback APIs

`POST /api/questions/:questionId/rating`

Stores question rating.

`POST /api/questions/:questionId/report`

Stores issue report.

### 9.6 Admin APIs

`GET /api/admin/questions`

`POST /api/admin/questions`

`PATCH /api/admin/questions/:questionId`

`DELETE /api/admin/questions/:questionId`

`GET /api/admin/reports`

`PATCH /api/admin/reports/:reportId`

## 10. UX And UI Requirements

### 10.1 General UX

- The first screen should help the user start a quiz quickly.
- The app should not feel like only a landing page.
- Quiz actions must be visible without excessive scrolling.
- Mobile layout must keep answer buttons readable.
- Timers and scoring penalties must be clear.
- Disabled buttons must explain what is missing.

### 10.2 Quiz Page UX

Quiz page must include:

- Quiz title.
- Question number.
- Timer.
- Progress bar.
- Answer options.
- Submit button.
- Previous/next controls.
- Flag control.
- Hint and 50/50 controls if available.
- Question index.

After answer submit:

- Correct/wrong indicator.
- Correct answer.
- Explanation.
- Optional question rating/report actions.

### 10.3 Completion Page UX

Completion page must include:

- Score summary at top.
- Review wrong and unanswered answers.
- Topic performance.
- Time analytics.
- Earned rewards.
- Next action buttons.

### 10.4 Admin UX

Admin question editor must include:

- Category/topic selectors.
- Difficulty selector.
- Question text editor.
- Options editor.
- Correct answer selector.
- Hint field.
- Explanation field.
- Status selector.
- Save/publish buttons.

## 11. Non-Functional Requirements

### 11.1 Performance

- Initial route should load within 3 seconds on normal broadband.
- Quiz interactions should respond within 100 ms locally after data is loaded.
- Question fetch should complete within 1 second for typical requests.
- 3D assets must not block quiz functionality.
- Heavy 3D visuals should be disabled or reduced on low-power devices if needed.

### 11.2 Reliability

- In-progress registered attempts should survive refresh.
- Submitted attempts must be idempotent.
- Duplicate submit clicks must not double-award XP.
- Backend errors must show recoverable UI messages.

### 11.3 Security

- Passwords must never be stored in frontend code or local storage.
- Admin APIs must require admin role.
- User can access only own attempts.
- Backend must validate all scoring inputs.
- Frontend score cannot be trusted as final score.
- Rate limits should protect auth and answer submission endpoints.

### 11.4 Privacy

- User must choose whether to appear on public leaderboard.
- Public leaderboard should show display name, not email.
- Personal contact data should not be exposed unless intended.
- Privacy Policy and Terms pages must exist before launch.

### 11.5 Accessibility

- Keyboard navigation must work for quiz flow.
- Answer options must have accessible labels.
- Timer warnings must not rely only on color.
- Focus states must be visible.
- Forms must have labels and validation messages.
- Color contrast must meet WCAG AA where practical.

### 11.6 Browser Support

Minimum:

- Latest Chrome
- Latest Edge
- Latest Firefox
- Latest Safari
- Mobile Chrome
- Mobile Safari

## 12. Technical Plan

### 12.1 Frontend

Current frontend stack:

- React 18
- Vite
- React Router
- Tailwind CSS
- Framer Motion
- GSAP
- React Three Fiber
- Drei
- React Toastify

Required frontend changes:

- Refactor app into page routes.
- Move quiz state to dedicated hooks/services.
- Create API client layer.
- Centralize scoring display rules.
- Add form validation.
- Add loading/error states.
- Remove hard-coded localhost links.
- Replace fake data with API calls.
- Add tests.

### 12.2 Backend

Backend is currently missing.

Recommended backend capabilities:

- Auth
- User profiles
- Question catalog
- Attempts
- Scoring
- Leaderboards
- Admin question management
- Reporting

Implementation options:

1. Fastest path: managed backend with Postgres/Auth.
2. Custom path: Node/Express or similar API with PostgreSQL.
3. Demo-only path: static JSON questions plus local storage, not recommended for final completion.

PRD requirement: final product must use a real persistent backend. The implementation team should choose one backend path before Phase 2 begins.

### 12.3 Suggested Folder Structure

Frontend:

```text
src/
  api/
    client.js
    attempts.js
    auth.js
    catalog.js
    leaderboard.js
  app/
    router.jsx
  components/
    common/
    quiz/
    layout/
  pages/
    HomePage.jsx
    QuizSelectionPage.jsx
    QuizTakingPage.jsx
    ResultsPage.jsx
    LoginPage.jsx
    SignupPage.jsx
    DashboardPage.jsx
    LeaderboardPage.jsx
    AdminQuestionsPage.jsx
  hooks/
    useAuth.js
    useQuizAttempt.js
  services/
    scoring.js
    badges.js
  data/
    seedQuestions.json
  styles/
```

### 12.4 Testing

Required test types:

- Unit tests for scoring.
- Unit tests for badge rules.
- Unit tests for quiz selection filtering/pagination.
- Component tests for quiz question flow.
- Integration tests for attempt create/answer/submit.
- End-to-end tests for guest quiz journey.
- End-to-end tests for registered user journey.
- Admin permissions tests.

Minimum before launch:

- Build passes.
- Core unit tests pass.
- Guest quiz E2E passes.
- Registered quiz E2E passes.
- Admin cannot be accessed by non-admin.

## 13. Milestone Roadmap

### Phase 0: Stabilize Repository And Environment

Goal: Make the current project readable, buildable, and safe to modify.

Tasks:

- Fix OneDrive hydration for `src/styles.js` and `src/index.css`.
- Run successful production build.
- Rename package from `3dfolio` to `quizarena`.
- Remove unused template dependencies or document why kept.
- Add README setup instructions.
- Add visible CC-BY credits for 3D models.
- Fix obvious route/link bugs.
- Decide backend implementation path.

Exit criteria:

- `npm.cmd run build` succeeds.
- No unreadable source files.
- README explains local setup.
- PRD and audit are committed or saved.

### Phase 1: Real Quiz MVP Data

Goal: Replace sample question generator with real question source.

Tasks:

- Define question schema.
- Add seed question data or backend question table.
- Build catalog service.
- Replace `generateQuizData`.
- Validate selected topic/difficulty/question count.
- Show insufficient-question state.
- Randomize question and option order.
- Update completion analytics to use stable question IDs.

Exit criteria:

- User can take quiz with real questions.
- No `Sample question` text appears.
- No fixed `Option A` answer pattern exists.
- Scoring is correct across unanswered, wrong, and correct answers.

### Phase 2: Routing And Core UX Refactor

Goal: Make app behave like a real product instead of one landing page with embedded routes.

Tasks:

- Create page-level route structure.
- Move landing sections to home route.
- Move selection to `/quizzes`.
- Move quiz taking to `/quiz/:attemptId`.
- Move results to `/results/:attemptId`.
- Add 404.
- Fix footer routes or remove dead links.
- Replace hard-coded localhost anchor.
- Improve mobile quiz layout.

Exit criteria:

- Quiz page contains only quiz UI and necessary app shell.
- All visible links resolve.
- Back/refresh behavior is predictable.

### Phase 3: Persistence And Attempts

Goal: Save attempts and make scoring reproducible.

Tasks:

- Implement attempt creation.
- Store selected question snapshot.
- Store answers per question ID.
- Store timer and lifeline usage.
- Implement final submission.
- Centralize scoring in pure service.
- Add attempt result retrieval.
- Add local guest attempt fallback.

Exit criteria:

- Refreshing a registered in-progress attempt restores state.
- Final submit is idempotent.
- Result page can be reopened later.

### Phase 4: Authentication And User Dashboard

Goal: Give users accounts and saved progress.

Tasks:

- Implement signup/login/logout.
- Implement forgot password.
- Create user profile.
- Protect dashboard route.
- Build dashboard from real attempts.
- Persist XP, level, streaks, and badges.
- Remove fake alert-based auth.

Exit criteria:

- User can create account and save quiz history.
- User can log out and log back in.
- Dashboard shows real data.

### Phase 5: Leaderboards, Badges, Reports

Goal: Add social/competitive systems based on real attempts.

Tasks:

- Implement leaderboard API.
- Add leaderboard page.
- Add category/topic/difficulty filters.
- Add leaderboard opt-in setting.
- Implement badge rules.
- Persist badge awards.
- Implement question rating/reporting.
- Build admin report review.

Exit criteria:

- Leaderboard has no hard-coded users.
- Badges are awarded once and persist.
- Reports can be reviewed by admin.

### Phase 6: Admin Content Management

Goal: Allow quiz content to evolve without code edits.

Tasks:

- Add admin role.
- Build question list.
- Build question editor.
- Build category/topic management.
- Add publish/archive workflow.
- Add validation for question quality.
- Add report-to-question workflow.

Exit criteria:

- Admin can create and publish a question.
- Non-admin cannot access admin screens or APIs.
- Reported question can be fixed or disabled.

### Phase 7: Certificates, Sharing, And Marketing Cleanup

Goal: Remove misleading placeholders and add optional polish.

Tasks:

- Remove or implement certificate button.
- Generate real certificate with verification URL.
- Replace share URL with production domain.
- Remove fake user count.
- Replace fake testimonials or label them differently.
- Verify social links.
- Implement or remove newsletter/contact form.
- Add Privacy and Terms pages.

Exit criteria:

- No fake production claims remain.
- Public-facing links are valid.
- Legal/basic policy pages exist.

### Phase 8: Quality, Accessibility, Performance, Launch

Goal: Make project shippable.

Tasks:

- Add unit tests.
- Add E2E tests.
- Add lint/format scripts.
- Run accessibility pass.
- Optimize 3D asset loading.
- Add loading/error/empty states.
- Add environment configuration docs.
- Add deployment docs.
- Run production build.
- Deploy staging.
- Run smoke tests.
- Deploy production.

Exit criteria:

- Build passes.
- Tests pass.
- Core flows pass on desktop/mobile.
- App is deployed and documented.

## 14. Acceptance Criteria By Release

### MVP Acceptance Criteria

- User can take a quiz with real questions as guest.
- User can create account and save attempts.
- User can view quiz results later.
- Question count and difficulty work.
- Scoring is accurate and reproducible.
- Completion page includes correct, wrong, unanswered, and timing analytics.
- No hard-coded fake leaderboard is presented as real.
- Production build succeeds.
- README exists.
- 3D model credits exist.

### Version 1 Acceptance Criteria

- Admin can manage questions.
- Real leaderboard works.
- XP, levels, badges, and streaks persist.
- Question reports persist and are reviewable.
- Certificate/share feature is real or removed.
- Privacy and Terms pages exist.
- Tests cover scoring, attempts, auth, dashboard, and leaderboards.
- App is deployed to production.

## 15. Success Metrics

### Product Metrics

- Quiz start conversion: percentage of visitors who start a quiz.
- Quiz completion rate.
- Average score improvement by topic over repeated attempts.
- Registered user conversion after guest quiz.
- Returning user rate.
- Number of reports per 100 questions.
- Leaderboard participation rate.

### Technical Metrics

- Build success rate.
- Core flow E2E pass rate.
- API error rate.
- Average question fetch latency.
- Frontend load time.
- JavaScript bundle size.

## 16. Risks And Mitigations

Risk: Too much fake UI remains and users lose trust.

Mitigation:

- Hide features until real.
- Label guest/local functionality clearly.
- Remove inflated claims.

Risk: Question content takes longer than code.

Mitigation:

- Start with fewer categories but real reviewed questions.
- Add admin tooling early.
- Track content coverage by topic/difficulty.

Risk: Scoring can be manipulated from frontend.

Mitigation:

- Score on backend using attempt snapshots.
- Treat frontend score as display only.

Risk: 3D assets hurt performance.

Mitigation:

- Lazy-load canvases.
- Provide reduced-motion/low-power fallback.
- Keep quiz UI independent of 3D assets.

Risk: OneDrive file-provider issues block development.

Mitigation:

- Make repo available offline.
- Move active working copy outside OneDrive if needed.
- Re-run build after hydration.

Risk: Scope expands too quickly.

Mitigation:

- Ship MVP first.
- Defer classrooms, friends, multiplayer, and AI question generation.

## 17. Open Decisions

1. Which backend will be used?
   - Managed backend/Auth/Postgres, custom Node API, or another stack.

2. Will guest mode be supported permanently?
   - Recommended: yes for taking quizzes, no for persistent leaderboard.

3. Who will create/review the initial question bank?
   - Need a content owner.

4. Should explanations be mandatory for every question?
   - Recommended: yes.

5. Should immediate feedback be shown during quiz, or only after final submission?
   - Current prototype uses immediate feedback.

6. Should certificates be MVP or Version 1?
   - Recommended: Version 1 unless needed for demo.

7. Should social links/testimonials/contact details remain?
   - Only if real and approved.

## 18. Detailed Backlog

### P0 Must Fix

- Make source files readable locally.
- Fix build.
- Replace mock question generator.
- Fix scoring analytics.
- Fix route structure.
- Remove hard-coded localhost link.
- Remove fake leaderboard or replace with real.
- Remove fake auth alerts or implement real auth.
- Add README and credits.

### P1 Should Build

- Persist attempts.
- Add dashboard.
- Add real leaderboard.
- Add badges/streak persistence.
- Add issue reporting persistence.
- Add admin question management.
- Add tests.
- Add privacy/terms routes.

### P2 Nice To Have

- Certificates.
- Advanced analytics.
- Social sharing.
- Reduced-motion 3D settings.
- Import/export questions.
- Friends/classroom scopes.

## 19. Implementation Sequence Recommendation

Recommended order:

1. Stabilize repo/build.
2. Refactor routes.
3. Create real question schema and seed data.
4. Replace quiz generator.
5. Extract scoring service and test it.
6. Persist attempts.
7. Add auth.
8. Build dashboard.
9. Build leaderboard.
10. Build admin question tools.
11. Clean marketing placeholders.
12. Add tests and deploy.

This order avoids building dashboards, leaderboards, and certificates on top of fake quiz data.

## 20. Completion Definition

The project is complete when:

- A real user can sign up, take real quizzes, save results, and review progress.
- Admin can manage question content.
- Leaderboards and rewards are based on real submitted attempts.
- No fake production claims remain.
- App builds and deploys successfully.
- README explains setup, environment, testing, and deployment.
- Asset licenses are credited.
- Core flows are tested.
- The codebase no longer depends on portfolio-template leftovers for product behavior.

