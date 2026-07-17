# Quiz Arena Project Audit

Audit date: 2026-07-14
Workspace: `C:\Users\ACER\OneDrive\Desktop\Quiz Arena`

## Executive Summary

Quiz Arena is a React/Vite single page app adapted from a 3D portfolio template. The project has a real front-end shell and a partially working local quiz-taking flow, but it does not yet have real quiz content, authentication, persistence, backend APIs, leaderboard data, certificate generation, newsletter submission, or production verification.

The project appears to have been made to present an interactive quiz platform where users choose a category/topic/difficulty, take timed quizzes, receive feedback, collect points/XP/badges, and see completion analytics. That product direction is clear from the UI copy and component structure.

Approximate completeness:

- Real front-end UI and navigation: 55 percent
- Real quiz runtime mechanics: 45 percent
- Real product data/backend/auth/persistence: 0 to 10 percent
- Production readiness: 15 percent
- Overall project reality: about 35 percent built, 65 percent mocked, placeholder, template-derived, or incomplete

## Major Findings

1. No real question database exists.
   - `src/components/QuizPage.jsx:7-22` explicitly generates mock questions.
   - Every question is `Sample question ...`, every answer is `"Option A"`, and options are always `"Option A"` through `"Option D"`.

2. No backend exists.
   - No `fetch`, API route, database client, Firebase, Supabase, Prisma, MongoDB, or environment variable usage was found in the readable source.
   - `package.json` includes `@emailjs/browser` and `email-js`, but neither is used in the current readable source.

3. Authentication is fake.
   - `src/components/Auth.jsx` only changes local component state and shows `alert()` messages.
   - No accounts are created, no sessions are stored, no password reset email is sent, and no contact message is delivered.

4. Leaderboards and certificates are fake.
   - `src/components/QuizCompletionPage.jsx:6-20` uses hard-coded mock leaderboard data.
   - `src/components/QuizCompletionPage.jsx:87-91` returns a placeholder certificate URL at `https://your-quiz-app.com/...`.

5. User progress is not persistent.
   - Points, XP, badges, streaks, reports, comments, ratings, and quiz count are React state only.
   - Refreshing or leaving the quiz loses progress.
   - `handleRestart` passes XP/streak/badges back to `/quizpage`, but `QuizPage.jsx` ignores those values.

6. The app is still strongly template-derived.
   - `package.json` still names the project `3dfolio`.
   - Git shows many deleted portfolio files: `desktop_pc`, `tech` icons, portfolio project images, old `Dashboard.jsx`, old `auth2.jsx`, and `components/index.js`.
   - 3D model usage and style utilities are from a portfolio-style template.

7. Current build verification is blocked.
   - `npm run build` fails in PowerShell because scripts are disabled.
   - `npm.cmd run build` inside the sandbox fails with an esbuild parent-directory access error.
   - Escalated `npm.cmd run build` timed out after about two minutes and produced no `dist`.
   - `src/styles.js` and `src/index.css` are modified in the worktree but unreadable due OneDrive cloud-file errors: `Invalid argument` / cloud operation unsuccessful. I audited the committed versions from Git, but not the current modified bytes.

8. Git working tree is dirty.
   - Many tracked template files are deleted.
   - `src/App.jsx`, `src/assets/index.js`, `src/components/About.jsx`, `src/components/Hero.jsx`, `src/components/Loader.jsx`, `src/components/canvas/index.js`, `src/index.css`, and `src/styles.js` are modified.
   - `public/robot_playground/` and `src/components/canvas/RobotPlaygroundCanvas.jsx` are untracked.

## What Is Real

- Vite + React application entry: `index.html`, `src/main.jsx`, `src/App.jsx`.
- React Router routes for `/`, `/quizpage`, and `/quiz-completion`.
- Category/topic selection UI with search, pagination, modal, difficulty, and question count.
- Local quiz-taking UI with timer, answer selection, feedback, hints, 50/50, flags, review screen, points, XP, levels, streaks, badges, comments, ratings, and issue reporting.
- Completion page UI with local score calculations, subtopic breakdown, timing analytics, wrong-answer review, mock leaderboards, sharing, restart, and back navigation.
- 3D visual layer using `@react-three/fiber`, `@react-three/drei`, GLTF assets, star field, earth model, and robot model.
- Tailwind styling setup and static assets.

## What Is Fake Or Placeholder

- Quiz questions and answers.
- User accounts.
- Login/signup/forgot-password/contact.
- Newsletter subscription.
- Leaderboards.
- Certificate generation.
- Social proof: "Join over 10,000 quiz enthusiasts!"
- Testimonials and testimonial users.
- Global/friends/classroom rankings.
- Share URL/domain.
- Dashboard/progress system from deleted `Dashboard.jsx`.
- Official social links/contact details unless those accounts are actually owned and maintained.

## Important Bugs And Risks

### Routing and layout

- `src/App.jsx:20-45`: Navbar, hero, about, feedback, auth, stars, and footer render on every route. Visiting `/quizpage` still shows the landing content around the quiz instead of a clean quiz page.
- `src/App.jsx:26`: `classname` should be `className`; the class is ignored.
- `src/components/Hero.jsx:37`: hard-coded `http://localhost:5173/#Quizzes` breaks outside local development.
- `src/components/Footer.jsx:85-100` and `src/components/Footer.jsx:190-191`: links point to `/about`, `/contact`, `/privacy`, and `/terms`, but those routes are not defined.

### Quiz selection

- `src/components/QuizSelectionPage.jsx:141`: `totalPages` is based on all quizzes, not filtered quizzes, so search results can show wrong pagination.
- `src/components/QuizSelectionPage.jsx:155-158`: selecting a new category does not reset `selectedTopic`, so a previous topic can leak into a different category.
- `src/components/QuizSelectionPage.jsx:341-363`: `parseInt` can produce `NaN`; the validation does not reject `NaN`.
- `src/components/QuizSelectionPage.jsx:166-174`: `handleStartQuiz` is defined but unused.
- `src/components/QuizSelectionPage.jsx:306`: close button text appears mojibaked as `âœ•`.

### Quiz runtime

- `src/components/QuizPage.jsx:7-22`: mock generator makes every answer `Option A`.
- `src/components/QuizPage.jsx:93-105`: keyboard shortcut handler can read `quizData[currentQIndex].options` before quiz data exists if a key is pressed at the wrong moment.
- `src/components/QuizPage.jsx:109-141`: scoring is local only and can be affected by stale state if submission paths fire unexpectedly.
- `src/components/QuizPage.jsx:210-238`: quiz count and daily streak are local state and reset when the component remounts.
- `src/components/QuizPage.jsx:240-257`: ratings, comments, and issue reports are stored only in memory and never surfaced meaningfully outside the current session.
- `src/components/QuizPage.jsx:489` and `src/components/QuizPage.jsx:504`: `onKeyPress` is deprecated in React.
- Multiple visible strings contain mojibake such as `ðŸ‘`, `ðŸ‘Ž`, and other broken characters.

### Completion analytics

- `src/components/QuizCompletionPage.jsx:53-56`: score calculation uses `Object.values(answers).filter((ans, idx) => ans === quizData[idx].answer)`. If some questions are unanswered, `idx` no longer reliably matches the original question index.
- `src/components/QuizCompletionPage.jsx:151-165`: wrong-answer review excludes unanswered questions.
- `src/components/QuizCompletionPage.jsx:77-84`: share text and URL use placeholder/social assumptions.
- `src/components/QuizCompletionPage.jsx:87-91`: certificate link is a placeholder domain.

### Auth, contact, newsletter

- `src/components/Auth.jsx:24-49`: submit is simulated with `setTimeout` and `alert`.
- `src/components/Auth.jsx`: inputs are mostly not marked `required`, and there is no validation beyond signup password matching.
- `src/components/Footer.jsx:19-40`: newsletter subscription is simulated with `setTimeout`.
- `src/components/Footer.jsx`: contact information is hard-coded personal data; confirm it should be public.

### 3D and assets

- `src/components/canvas/Earth.jsx:8`: `useGLTF("./planet/scene.gltf")` is route-relative. On routes like `/quizpage`, this can resolve incorrectly. It should likely be `/planet/scene.gltf`.
- `src/components/canvas/RobotPlaygroundCanvas.jsx:18-24`: adds a `finished` event listener every animation cycle.
- `src/components/canvas/RobotPlaygroundCanvas.jsx:29`: `mixer.removeEventListener("finished")` is called without the original handler, so listeners are not removed.
- `public/planet/license.txt` and `public/robot_playground/license.txt`: both models are CC-BY-4.0 and require credit. I did not find visible attribution in the app or README.

## File-By-File Audit

### Root files

- `.gitignore`
  - Real config. Ignores logs, `node_modules`, `dist`, editor files, `.env`. Fine.

- `README.md`
  - Empty. Missing setup instructions, feature status, licenses/credits, screenshots, and known limitations.

- `index.html`
  - Real Vite entry. Sets title `QuizArena`, favicon points to `/src/assets/logo.png`, and mounts `src/main.jsx`.

- `package.json`
  - Real dependency manifest but still named `3dfolio`.
  - Contains unused dependencies for email, heroicons, vertical timeline, and likely old template features.
  - No test/lint scripts.

- `package-lock.json`
  - Generated npm lockfile. Root package is still `3dfolio`. Not authored app logic.

- `vite.config.js`
  - Standard Vite React config. Real and minimal.

- `tailwind.config.cjs`
  - Real Tailwind config. Defines template-style dark palette, shadows, custom `xs`, and hero background image.

- `postcss.config.cjs`
  - Standard Tailwind + Autoprefixer config. Real and minimal.

### Source entry and global styling

- `src/main.jsx`
  - Real app mount using `ReactDOM.createRoot` and `React.StrictMode`.

- `src/App.jsx`
  - Real layout/router composition.
  - Problem: routes are embedded inside the landing page, so page-specific routes still render surrounding landing sections.
  - Bug: `classname` typo.

- `src/styles.js`
  - Current worktree file is modified but unreadable due OneDrive file-provider errors.
  - Committed version exports Tailwind class strings for padding and typography.
  - Risk: current modified content could differ, but could not be audited.

- `src/index.css`
  - Current worktree file is modified but unreadable due OneDrive file-provider errors.
  - Committed version contains Poppins import, Tailwind directives, gradient helpers, and canvas loader animation.
  - Risk: current modified content could differ, but could not be audited.

### Data/constants

- `src/constants/index.js`
  - Provides nav links, service cards, testimonials, and empty `projects`.
  - Service cards are static marketing claims.
  - Testimonials appear fabricated/demo content unless proven real.
  - Text contains mojibake in the live file output in some reads.

### Quiz components

- `src/components/QuizSelectionPage.jsx`
  - Real UI for categories/topics/search/pagination/modal.
  - Static quiz categories are present for CS, engineering, medical, law, science, math, English, and reasoning.
  - No real question lookup occurs.
  - Pagination/search/topic-state validation bugs noted above.

- `src/components/QuizPage.jsx`
  - Largest real interaction component.
  - Real local mechanics: timer, answer state, points, XP, level, streak, hints, 50/50, flags, review, toasts, comments, ratings, report issue.
  - Fake data source: generated sample questions with one fixed answer.
  - No persistence or backend.
  - Several state and analytics risks noted above.

- `src/components/QuizCompletionPage.jsx`
  - Real local result screen.
  - Fake leaderboard and certificate.
  - Score calculation has an unanswered-question indexing bug.
  - Social share URL and certificate URL are placeholders.

### Layout and marketing components

- `src/components/Navbar.jsx`
  - Real responsive navbar with scroll background and hash links.
  - Uses static `navLinks`.
  - Does not include auth state, dashboard, profile, or active route awareness beyond local click state.

- `src/components/Hero.jsx`
  - Real landing hero with robot canvas.
  - Fake social proof claim.
  - Hard-coded localhost start link.

- `src/components/About.jsx`
  - Real static marketing/about section.
  - Uses GSAP scroll animations and service cards.
  - `audienceRef` and `visionRef` are declared but not attached to rendered content.
  - Some content claims features that are only mocked.

- `src/components/Feedbacks.jsx`
  - Real testimonial card renderer.
  - Testimonials are static/fake unless backed by real users.
  - GSAP animation is visual only.

- `src/components/Auth.jsx`
  - Real form UI.
  - Fake auth/contact behavior using alerts and timeout.
  - No secure handling, backend, sessions, or delivery.

- `src/components/Footer.jsx`
  - Real footer UI with quick links, social links, contact info, newsletter, and scroll-to-top button.
  - Newsletter is fake.
  - Some links route to pages that do not exist.
  - Contact/social details need verification before public launch.

- `src/components/Loader.jsx`
  - Real loader component for `@react-three/drei` progress.

### Canvas components

- `src/components/canvas/index.js`
  - Real barrel export for canvas components.

- `src/components/canvas/Earth.jsx`
  - Real Three/Fiber canvas for the planet model.
  - Route-relative GLTF path is risky.

- `src/components/canvas/Stars.jsx`
  - Real animated star-field canvas.

- `src/components/canvas/RobotPlaygroundCanvas.jsx`
  - Real robot GLTF canvas.
  - Untracked in Git.
  - Event listener cleanup is incorrect and can leak listeners.

### HOC and utilities

- `src/hoc/SectionWrapper.jsx`
  - Real HOC adding motion section, consistent padding, and hash anchor.

- `src/hoc/index.js`
  - Real barrel export.

- `src/utils/motion.js`
  - Real Framer Motion variant helpers.
  - Generic template utility. Fine.

### Assets

- `src/assets/index.js`
  - Real asset barrel export.
  - Git-modified. Current readable version exports logo, icon images, menu/close SVGs, and three testimonial images.

- `src/assets/logo.png`
  - Static logo asset. Not audited visually.

- `src/assets/backend.png`
  - Static icon asset for "Real-Time Feedback".

- `src/assets/creator.png`
  - Static icon asset for "Competitive Leaderboard".

- `src/assets/mobile.png`
  - Static icon asset for "Interactive Question System".

- `src/assets/web.png`
  - Static icon asset for "Diverse Quiz Library".

- `src/assets/herobg.png`
  - Static background image used by Tailwind `bg-hero-pattern`.

- `src/assets/menu.svg`
  - Static mobile menu icon.

- `src/assets/close.svg`
  - Static mobile close icon.

- `src/assets/Tars Ken.webp`
  - Static testimonial image. Identity/usage not verified.

- `src/assets/image.webp`
  - Static testimonial image. Identity/usage not verified.

- `src/assets/third testimonial.webp`
  - Static testimonial image. Identity/usage not verified.

### Public 3D assets

- `public/planet/license.txt`
  - CC-BY-4.0 license/credit for "Stylized planet" by cmzw.
  - Must be credited wherever the model is used.

- `public/planet/scene.gltf`
  - Third-party Sketchfab GLTF metadata/model description. Generated asset, not authored app logic.

- `public/planet/scene.bin`
  - Binary GLTF geometry/animation buffer. Generated asset.

- `public/planet/textures/Clouds_baseColor.png`
  - Third-party texture asset.

- `public/planet/textures/Planet_baseColor.png`
  - Third-party texture asset.

- `public/robot_playground/license.txt`
  - CC-BY-4.0 license/credit for "Robot Playground" by Hadrien59.
  - Must be credited wherever the model is used.

- `public/robot_playground/scene.gltf`
  - Third-party Sketchfab GLTF metadata/model description. Large generated asset.

- `public/robot_playground/scene.bin`
  - Binary GLTF geometry/animation buffer. Generated asset.

- `public/robot_playground/textures/holo1_baseColor.png`
  - Third-party robot texture.

- `public/robot_playground/textures/holo1_emissive.jpeg`
  - Third-party robot texture.

- `public/robot_playground/textures/material_baseColor.jpeg`
  - Third-party robot texture.

- `public/robot_playground/textures/material_emissive.jpeg`
  - Third-party robot texture.

- `public/robot_playground/textures/material_metallicRoughness.png`
  - Third-party robot texture.

### Deleted but Git-tracked source/files

These are not present in the current worktree, but Git still tracks them as deleted:

- `src/components/Dashboard.jsx`
  - Deleted current file.
  - Git version was a fake/localStorage dashboard with sample quiz history.
  - It was not wired into current routes.

- `src/components/auth2.jsx`
  - Deleted current file.
  - Git version was an earlier auth form UI with no submit logic.

- `src/components/index.js`
  - Deleted current file.
  - Git version was a barrel export with router/toast exports mixed in.

- `public/desktop_pc/**`
  - Deleted old 3D desktop model assets from portfolio template.

- `src/assets/tech/**`, `src/assets/carrent.png`, `gearXpert.png`, `github.png`, `proj1.webp`, `project3.webp`
  - Deleted old portfolio/template assets.

### Vendor and metadata directories

- `node_modules/`
  - Installed third-party dependencies. Not authored project code and not audited line-by-line.

- `.git/`
  - Git metadata. Not app code. Initially cloud-placeholder access made Git appear unreadable, then status/log became available after hydration.

## Recommended Next Steps

1. Fix local file availability first.
   - Make `src/styles.js` and `src/index.css` fully available offline in OneDrive.
   - Re-run `npm.cmd run build` after the files are readable.

2. Replace the mock quiz generator.
   - Add a real question schema and data source.
   - Decide whether questions live in static JSON, a backend API, or a database.

3. Separate routes into real pages.
   - Landing page should render hero/about/selection.
   - Quiz route should render only quiz UI.
   - Completion route should render only completion UI.

4. Implement persistence.
   - Store quiz attempts, answers, XP, streaks, badges, comments, and reports.
   - Use backend auth before exposing leaderboards or user profiles.

5. Replace fake systems.
   - Real auth.
   - Real leaderboard.
   - Real newsletter/contact delivery or remove the claims.
   - Real certificate generation or remove placeholder link.

6. Clean template remnants.
   - Rename package from `3dfolio`.
   - Remove unused dependencies and dead/deleted tracked files.
   - Add README with setup, status, and asset credits.

7. Add tests.
   - Unit-test scoring, answer review, pagination/search, topic selection, and completion analytics.
   - Add a build verification script and linting.

