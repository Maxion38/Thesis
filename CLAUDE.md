# CLAUDE.md — TFE (Thesis) Management Platform

Web app for managing and evaluating **end-of-studies theses (TFE — Travail de Fin d'Études)**: training courses, pedagogical modules, tools (work submission, forms, activities, assessment grids), role management (student / teacher / coordinator / external) and thesis-defense juries.

**Stack:**

| Layer | Technology |
|---|---|
| Frontend | Angular 21 (standalone components, no NgModules) |
| Backend | NestJS 11 + Prisma ORM 5 |
| Database | PostgreSQL 16 |
| Auth | JWT (httpOnly cookie) + Passport |
| Emails | Brevo (transactional, invitations) |
| Containerization | Docker / Docker Compose (dev, prod-from-source, prod-from-Docker-Hub) |

**Monorepo**: `backend/` (NestJS API) and `frontend/` (Angular SPA), orchestrated from the repo root via npm scripts and `docker-compose.*.yml` files. There is no `shared/` folder between the two — DTOs are duplicated on the frontend as TypeScript models.

---

## 2. Commands

**Root (dev, runs everything in parallel):**
- `npm run dev` — DB (docker) + backend + frontend + Prisma Studio
- `npm run dev:db` / `dev:backend` / `dev:frontend` / `dev:studio` — same, individually

**Backend (`backend/`):**
- `npm run start:dev` — watch mode
- `npm run lint` — eslint --fix
- `npm run test` / `test:watch` / `test:cov` / `test:e2e`
- `npm run seed:demo` — regenerate demo data (see §3)
- `npx prisma migrate dev` — create/apply a migration · `npx prisma studio` — DB browser

**Frontend (`frontend/`):**
- `npm start` (`ng serve`) · `npm run build` · `npm test`

**Prod (root):**
- `npm run prod` / `prod:down` / `prod:logs` — docker-compose prod stack
- `npm run publish` — build + push images to Docker Hub (`publish.ps1`)

---

## 3. Database (Prisma / PostgreSQL)

The schema (`backend/prisma/schema.prisma`) is the V2 of a model derived from a French draw.io schema. Key points:

### Model domains

- **Users & roles**: `User`, `Role` (STUDENT/TEACHER/COORDINATOR/EXTERNAL), `UserRole` (many-to-many — a user can hold several roles at once), `SubRole` (SUPERVISOR/PRESIDENT/READER — jury roles), `Invitation` (email-based onboarding).
- **Training structure**: `TrainingCourse` → `Module` → `Tool`. `Tool` is an **ISA supertype** (shared-key inheritance, `id`) whose subtypes are `Form`, `Activity`, `Work` and `AssessmentGrid` — each has its own model with `id` = `Tool.id`. `ToolLink` allows linking tools together.
- **Forms**: `Form` → `Question` → `QuestionOption`, with `FormSubmission` → `Response`.
- **Work submissions**: `Work` → `UserWorkSubmission` (file, path, attempt number).
- **Assessment grids**: `AssessmentGrid` → `Criteria` (criteria, default weight) → `Cell` (grading tiers with a description and a relative weight). `Weighting` allows a per-project override of a criterion's weight. `CriteriaAssessment` stores the score (Decimal) a teacher gives to a criterion for a project — **no cell is stored as an FK**: the "selected" cell is derived by the consumer by comparing the score against the cumulative bounds of the criterion's cell weights. `GridFeedback` carries a global comment (split into an internal `commentEval` / a student-visible `commentFeedback`).
- **Projects, groups, jury**: `Project` (attached to a `TrainingCourse`) → `ProjectMember` (user + optional `subRoleId` = jury role). `UserSupervisorPreference` (a student's ordered preferences for a supervisor). `Group` (generic container — jury, school appointment...) attached to an `Activity` via `eventId`, with `UserGroup` (assigned teachers) and `ProjectGroup` (projects assigned to the group).
- **Module access conditions**: `ConditionsGroup` → `ConditionsSubgroup` → `Condition` (AND/OR operators, methods USER_VALIDATION/SUPERVISOR_VALIDATION/TOOL_SUBMISSION/DATE), with `UserValidation` tracking manual validations. *(Modeled in the database but not yet used at the service level — see §4.)*
- **Notifications & notebook**: `Notification` (per user, with a source type/origin) and `Notebook` (free-form notes per user/project).

### Notable design decisions (from the schema's comments)

- Removal of the `GridVersion` layer and of the notion of "success conditions" (a completed item is inferred directly — work submitted, date passed, etc.).
- Removal of `Project.supervisorId` / `User.supervisorId`: the supervisor/jury hierarchy now goes solely through `ProjectMember.subRoleId`.
- `Group` / `FormSubmission` / `UserWorkSubmission` have no `status` field — only the submission date is authoritative.

### Migrations & seed

- Standard Prisma migrations under `backend/prisma/migrations/`.
- `prisma/seed.ts`: **system** seed, idempotent, run automatically on backend container startup — creates only the 4 `Role`s and 3 `SubRole`s.
- `prisma/seed-demo.ts`: large **demo** seed, run manually (`npm run seed:demo`), never automatic. Generates with `faker-js` (FR locale, fixed seed) 2 training courses, ~35 students/course, teachers, coordinators, externals (shared password `Demo1234!`), duo/solo projects, and **7 real assessment grids** copied from the school's actual PDF rubrics (cahier des charges, subject validation, analysis, supervisor follow-up, final report, practical work, oral defense). Idempotent via tagging (emails ending `@demo.thesis`, `DEMO ` prefix): a `resetDemoData()` wipes previous demo data before regenerating it.

---

## 4. Backend (NestJS)

### Bootstrap (`main.ts`)

- `helmet()` for security headers, `cookie-parser` (the JWT travels as an httpOnly cookie, not an `Authorization` header), CORS restricted to `http://localhost:4200` with `credentials: true` (⚠️ origin hardcoded, not driven by an environment variable).
- Global `ValidationPipe` (`whitelist: true, forbidNonWhitelisted: true`): any DTO field not declared with `class-validator` decorators is stripped/rejected.

### Modules (`AppModule`)

`PrismaModule` (global) · `TrainingCoursesModule` · `ModulesModule` · `AuthModule` · `InvitationModule` · `UsersModule` · `AssignmentsModule` · `WorkSubmissionToolModule` · `ToolsModule` · `AssessmentGridModule` · `ConfigModule` (global).

There is **no dedicated module yet** for `Form`/`Activity`/`Project`/`Group`/`Notebook` — these Prisma models exist in the database but are not exposed through any API route at this stage (only populated by the demo seed).

### Authentication & authorization

- **Flow**: email + password (bcrypt) → `AuthService` signs a JWT (`sub`, `email`, `roles`, 1-day expiry) set as an httpOnly cookie `access_token` (`sameSite: lax`, `secure: false` — to fix before going live over HTTPS).
- `JwtStrategy` (passport-jwt) extracts the token from the cookie and **trusts the payload** (`roles`) without re-checking the database — a role change only takes effect after re-login.
- **Guards** combined through a single decorator `@Auth(...roles: RoleType[])`: `JwtAuthGuard` (valid session) + `RolesGuard` (intersection between the required roles and `user.roles`). `@Auth()` with no argument = "authenticated, any role accepted".
- **No guard for SubRoles** (SUPERVISOR/PRESIDENT/READER) — not implemented at this stage.
- **First-account bootstrap**: `GET /auth/bootstrap-status` (true as long as no COORDINATOR exists) + `POST /auth/bootstrap-register`, locked once a coordinator exists.

### Business modules — key routes

| Module | Key routes | Roles | Purpose |
|---|---|---|---|
| `auth` | `GET /auth/me`, `POST /auth/login`, `POST /auth/logout`, bootstrap | public / any | JWT session |
| `invitation` | `POST /invitation/inviteUsers`, `GET /invitation/verifyActivationLink`, `POST /invitation/activateAccount` | COORDINATOR / public | Email onboarding (Brevo) |
| `users` | `GET /users`, `GET /users/my-first-project` | COORDINATOR+TEACHER / any | Directory, resolving the current user's project (`GET /users/:id` is a route stub, unimplemented) |
| `training-courses` | CRUD `/training-courses`, `/training-courses/details` (student/teacher counts), `/training-courses/:id/modules` | COORDINATOR (write) / any (read) | Training course management |
| `modules` | CRUD `/modules`, `GET /modules/:projectId/overview`, `GET /modules/:moduleId/details` | same | Modules + aggregation of tool state per user/project |
| `tools` | `GET /tools/module/:moduleId`, `PATCH/DELETE /tools/:id` | any / COORDINATOR | Generic tool supertype |
| `work-submission` | CRUD `/works`, upload/download/delete of submissions | COORDINATOR (config) / any (submission) | File submission (theses) |
| `assessment-grid` | `GET /assessment-grid/students`, `GET /assessment-grid/:gridId`, `PATCH .../criteria/:id/note`, `GET .../evaluations` | COORDINATOR+TEACHER | Criteria-based grading (newest, actively being built — see §5) |
| `assignments` | `GET .../assigned`, `GET .../assignable`, `POST .../assign`, `POST .../unassign` | COORDINATOR (+TEACHER read) | Assigning users to a training course (creates an individual `Project` per assigned student) |
| `email` | — (internal service) | — | Sending invitations via Brevo |

### Known gaps (backend)

- **Module locking conditions not implemented**: `ModulesService.findUserModulesOverview` always returns `status: { locked: false }` even though the DTOs (`ConditionDto`, `ModuleStatusDto`) already model the `ConditionsGroup`/`Condition` mechanism. Module access today is only gated at the training-course level (start/end dates of `TrainingCourse`).
- `Work.maxAttempts` is not enforced on submission (unlimited attempts in practice).
- File download (`GET .../submissions/:id/file`) forces `Content-Type: application/pdf` regardless of the actual file type.
- `SetCriteriaNoteDto` (assessment-grid) has no `class-validator` validation, unlike every other DTO in the project.
- File storage uses in-memory multer (`memoryStorage`) then synchronous disk writes (`fs.writeFileSync`) under `STORAGE_PATH/work-submissions/<Firstname_Surname>/`.

---

## 5. Frontend (Angular 21)

### General architecture

100% **standalone components** (no NgModules), single routing table (`app.routes.ts`) with three parallel route trees guarded by role: `/coordinator`, `/teacher`, `/student`, plus `/auth` (login, bootstrap, account activation). `provideAppInitializer` triggers `GET /auth/me` before the first render so guards have a valid session state immediately.

### Session & security

- Auth **via httpOnly cookie** (`withCredentials: true` on every HTTP request), no JWT in `localStorage`.
- `authInterceptor`: on a 401, it only redirects to `/auth/login` if the app already believed the user was logged in (avoids redirect loops on initial load).
- Guards: `AuthGuard` (session present), `RoleGuard` (role allowed on the route, via `route.data.roles`), `NoAuthGuard` (blocks access to `/auth/*` if already logged in), `BootstrapGuard` (switches between login ↔ register depending on whether a coordinator exists), `RootRedirectGuard` (dispatcher on `/`).

### Layouts

Four nearly identical layouts (`RouterOutlet` + `NavbarComponent` + `MenuComponent`), each with a role-specific menu: `coordinator-layout`, `teacher-layout`, `student-layout`, `auth-layout` (minimal). `main-layout` and `features/pages/users` exist but aren't referenced by any route (dead code / leftovers).

### Features by domain

- **`auth`**: login, first-coordinator-account bootstrap.
- **`invitations`**: bulk invitation sending (coordinator), account activation by token (invited user).
- **`training-course`**: CRUD of training courses, planning (start/end dates, computed status active/planned/inactive) — coordinator only.
- **`modules`**: creating/editing modules within a training course (coordinator); overview + detail consultation by a student (bucketing into to-do/to-fix/deadlines/locked); layout shared between coordinator and student to display the markdown description and the tools sidebar.
- **`work-tool`**: configuring a "Work" tool (due date, description), file submission by the student, teacher review of submissions.
- **`tools`**: generic abstraction consumed by the module layout (renaming/deleting tools); only the `WORK` type is actually implemented (forms/activities/assessments are planned but not wired into routes yet).
- **`assessments`**: teacher grading UI by grid/criterion (criterion-by-criterion navigation) — actively being built (see §5); as of now still no save call wired to the backend `PATCH .../criteria/:id/note` endpoint.
- **`assignments`**: two-pool coordinator UI (assignable / assigned) to attach users to a training course.
- **`users` / `user-inspection`**: cross-cutting directory, and a teacher drill-down view of a student (Submissions / Training Path / Profile tabs).
- **`pages/*` (dashboard, juries, notifications, supervisors)**: empty stub pages across all role sheets — jury/notification features not yet built on the UI side.

### State management

No state manager (NgRx, global signals): `providedIn: 'root'` services wrapping `HttpClient` + RxJS, consumed directly by components. `AuthService` keeps the current user as a plain in-memory field (no `BehaviorSubject`/`signal`).

### UI / styling

Angular Material is present but lightly used in practice (mostly the datepicker); most of the UI is hand-rolled, component-scoped SCSS, on top of a global Material 3 theme defined in `styles.scss` (azure/blue palette, Roboto typography). `marked` is used for markdown rendering (module/work descriptions).

### Frontend/backend modeling gap

The frontend `RoleType` enum (`COORDINATOR | TEACHER | STUDENT | GUEST`) does not yet reflect the `EXTERNAL` role nor the jury sub-roles (`SUPERVISOR`/`PRESIDENT`/`READER`) present in the database — consistent with the "juries"/"supervisors" pages still being stubs.

---

## 6. Overall functional flow

1. **Bootstrap**: first launch → `/auth/register` creates the initial COORDINATOR account; afterward → `/auth/login`.
2. **Coordinator**: creates `TrainingCourse`s → adds `Module`s to them → attaches `Tool`s (currently only "Work") → invites users by email and/or assigns them to the course (assigning a student automatically creates an individual `Project` for them).
3. **Student**: logs in → sees the module overview (derived from their first `Project`) → opens a module → reads its description → submits their work (file upload).
4. **Teacher**: browses users/projects → drills into a student → reviews their submissions → grades via criteria-based assessment grids (the active work-in-progress feature, both ends).
5. **Cross-cutting (unfinished)**: thesis-defense juries (`Group`/`ProjectGroup`/sub-roles modeled in the database, no UI), notifications, module access conditions (modeled in the database, not evaluated at the service level).

---

## 7. Deployment

Three Docker Compose files at the repo root:

- `docker-compose.dev.yml` — runs only PostgreSQL locally for development.
- `docker-compose.prod.yml` — locally builds the backend/frontend images + Postgres (`npm run prod`), persistent `postgres_data` volume, `./storage` volume mounted into the backend (`STORAGE_PATH=/app/storage`) for submitted files.
- `docker-compose.yml` — quick deployment by pulling prebuilt images from Docker Hub (no build, ~30s).

The backend automatically applies Prisma migrations and runs the system seed on container startup (see `backend/entrypoint.sh`). Notable environment variables: `DATABASE_URL`, `JWT_SECRET`, `STORAGE_PATH`, `BREVO_API_KEY`/`BREVO_SENDER_EMAIL`/`BREVO_SENDER_NAME`, `FRONTEND_URL`.
