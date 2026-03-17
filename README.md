# CRUD App

> Full-stack CRUD application with Fastify API backend and React frontend

---

## Table of Contents

### English
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [Database Schema](#database-schema)
- [Database Optimization](#database-optimization)
- [Migration](#migration)
- [Seed](#seed)
- [API Endpoints](#api-endpoints)
- [Frontend Pages](#frontend-pages)
- [Pagination](#pagination)
- [Useful Commands](#useful-commands)

### Myanmar
- [Tech Stack (MM)](#tech-stack-mm)
- [Project Structure (MM)](#project-structure-mm)
- [Prerequisites (MM)](#prerequisites-mm)
- [Getting Started (MM)](#getting-started-mm)
- [Environment Variables (MM)](#environment-variables-mm)
- [Authentication (MM)](#authentication-mm)
- [Database Schema (MM)](#database-schema-mm)
- [Database Optimization (MM)](#database-optimization-mm)
- [Migration (MM)](#migration-mm)
- [Seed (MM)](#seed-mm)
- [API Endpoints (MM)](#api-endpoints-mm)
- [Frontend Pages (MM)](#frontend-pages-mm)
- [Pagination (MM)](#pagination-mm)
- [Useful Commands (MM)](#useful-commands-mm)

---

## English

---

### Tech Stack

**Backend**
- **Runtime**: Node.js 24
- **Framework**: Fastify 5
- **Language**: TypeScript
- **Database**: PostgreSQL 17
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Auth**: JWT (Access Token + Refresh Token)
- **Docs**: Swagger UI (`/docs`)

**Frontend**
- **Framework**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Routing**: React Router 7
- **HTTP Client**: Axios
- **Build Tool**: Vite 7

**Infrastructure**
- Docker + Docker Compose
- Nginx (production frontend)

---

### Project Structure

```
CRUD/
├── backend/
│   ├── src/
│   │   ├── middlewares/   # Auth middleware (JWT verify)
│   │   ├── routes/        # Auth, User, Post routes
│   │   ├── schemas/       # Drizzle table schemas
│   │   ├── db.ts          # Database connection
│   │   ├── migrate.ts     # Migration runner
│   │   ├── seed.ts        # Admin user seeder
│   │   └── index.ts       # Server entry point
│   ├── drizzle/           # Migration files
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/    # Navbar, ProtectedRoute, Pagination
│   │   ├── context/       # AuthContext (token management)
│   │   ├── pages/         # Login, Register, Posts, Users, Profile
│   │   ├── services/      # API service layer (auth, users, posts)
│   │   └── types/         # TypeScript interfaces
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

---

### Prerequisites

- [Docker](https://www.docker.com/) installed on your machine
- That's it — no need to install Node.js or PostgreSQL locally

---

### Getting Started

**1. Clone the repository**
```bash
git clone <github-repo-url>
cd CRUD
```

**2. Create your `.env` file**
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values (see [Environment Variables](#environment-variables)).

**3. Run**
```bash
docker compose up --build
```

That's all. The following will happen automatically:
- PostgreSQL database starts
- Backend dependencies are installed and compiled
- Database migrations run
- Admin user is seeded
- Backend API starts on port `3000`
- Frontend is built and served via Nginx on port `80`

**4. Access the app**

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/docs |

---

### Environment Variables

Create `backend/.env` from the example file:

```env
DATABASE_URL=postgres://myuser:mypassword@db:5432/mydb

ADMIN_EMAIL=admin@test.com
ADMIN_PASSWORD=AdmintestPassword123!

JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ADMIN_EMAIL` | Seeded admin user email |
| `ADMIN_PASSWORD` | Seeded admin user password |
| `JWT_ACCESS_SECRET` | Secret key for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry (default: `1d`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (default: `7d`) |

---

### Authentication

This app uses a **dual JWT token** system:

| Token | Purpose | Expiry | Storage |
|-------|---------|--------|---------|
| **Access Token** | Authenticates API requests via `Authorization: Bearer <token>` header | Short-lived (default: 1 day) | localStorage |
| **Refresh Token** | Used to obtain a new access token when the current one expires | Long-lived (default: 7 days) | localStorage + database |

**How it works:**

1. **Login** — User submits credentials. Backend returns both an access token and a refresh token. The refresh token is also stored in the database.
2. **API Requests** — The access token is attached to every request automatically via Axios interceptor.
3. **Token Expiry** — When an API request returns `401`, the frontend automatically calls `/auth/refresh` with the refresh token to get a new access token, then retries the failed request.
4. **Logout** — The refresh token is sent to the backend, which deletes it from the database, invalidating the session.

---

### Database Schema

The app uses 3 tables managed by Drizzle ORM. Schemas are defined in `backend/src/schemas/`.

#### `users` table
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | Primary key, auto-generated |
| `name` | `varchar(100)` | NOT NULL |
| `email` | `varchar(255)` | NOT NULL, UNIQUE |
| `password` | `varchar(255)` | NOT NULL (bcrypt hashed) |
| `role` | `user_role` enum | `'admin'` or `'user'`, default: `'user'` |
| `phone_no` | `varchar(20)` | Optional |
| `description` | `text` | Optional |
| `created_at` | `timestamp` | Default: `now()` |
| `updated_at` | `timestamp` | Default: `now()` |

#### `posts` table
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | Primary key, auto-generated |
| `user_id` | `uuid` | FK → `users.id`, ON DELETE SET NULL |
| `title` | `varchar(255)` | NOT NULL |
| `content` | `text` | NOT NULL |
| `created_at` | `timestamp` | Default: `now()` |
| `updated_at` | `timestamp` | Default: `now()` |

#### `refresh_tokens` table
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | Primary key, auto-generated |
| `user_id` | `uuid` | FK → `users.id`, ON DELETE CASCADE |
| `token` | `text` | NOT NULL, UNIQUE |
| `expires_at` | `timestamptz` | NOT NULL |
| `is_revoked` | `boolean` | Default: `false` |
| `created_at` | `timestamptz` | Default: `now()` |

**Relationships:**
- `posts.user_id` → `users.id` (SET NULL on delete — posts are preserved when user is deleted)
- `refresh_tokens.user_id` → `users.id` (CASCADE on delete — tokens are deleted when user is deleted)

---

### Database Optimization

B-tree indexes are defined in each Drizzle schema for frequently queried columns:

| Index | Table | Column | Purpose |
|-------|-------|--------|---------|
| `idx_users_created_at` | `users` | `created_at` | Sorting users by creation date |
| `users_email_unique` | `users` | `email` | Unique constraint (auto-indexed) + login lookup |
| `idx_posts_user_id` | `posts` | `user_id` | Filtering posts by user (`GET /posts/byUser/:userId`) |
| `idx_posts_created_at` | `posts` | `created_at` | Sorting posts by newest first (`ORDER BY created_at DESC`) |
| `token_idx` | `refresh_tokens` | `token` | Fast token lookup during refresh/logout |
| `refresh_tokens_token_unique` | `refresh_tokens` | `token` | Unique constraint (auto-indexed) |

Indexes are defined directly in Drizzle schema files, e.g.:

```typescript
// backend/src/schemas/post_schema.ts
export const posts = pgTable("posts", {
  // ...columns
}, (table) => ({
  userIdIdx:    index("idx_posts_user_id").on(table.userId),
  createdAtIdx: index("idx_posts_created_at").on(table.createdAt),
}));
```

**Connection pool settings** (`backend/src/db.ts`):

| Setting | Value | Description |
|---------|-------|-------------|
| `connectionTimeoutMillis` | `3000` | Fail fast if DB is unreachable (3s) |
| `idleTimeoutMillis` | `10000` | Release idle connections after 10s |

---

### Migration

Migrations are handled by Drizzle Kit. SQL migration files are auto-generated from schema changes and stored in `backend/drizzle/`.

**How it works:**

1. Drizzle Kit compares your schema files (`backend/src/schemas/*.ts`) against the previous snapshot
2. Generates a SQL migration file (e.g., `0000_silly_photon.sql`) and a snapshot in `drizzle/meta/`
3. At startup, `backend/src/migrate.ts` runs all pending migrations

**Retry logic** — The migration runner waits for the database to be ready before running, retrying up to 10 times with 3-second intervals. This handles Docker startup ordering where PostgreSQL may not be ready yet:

```typescript
// backend/src/migrate.ts
async function waitForDb(pool: Pool, retries = 10, delay = 3000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      client.release();
      return;
    } catch {
      console.log(`⏳ Waiting for database... (${i + 1}/${retries})`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error("❌ Database not ready after retries");
}
```

**Commands:**
```bash
# Generate a new migration after schema changes
npx drizzle-kit generate

# Run pending migrations
npm run migrate        # tsx src/migrate.ts

# Run migrations + seed together
npm run setup          # npm run migrate && npm run seed
```

**Config** (`backend/drizzle.config.ts`):
```typescript
export default defineConfig({
  schema:  "./src/schemas",
  out:     "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

---

### Seed

The seed script (`backend/src/seed.ts`) creates an initial admin user using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables.

**What it does:**
1. Checks if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in `.env` — exits with error if not
2. Checks if a user with that email already exists — skips if found
3. Hashes the password with bcrypt (10 salt rounds)
4. Inserts the admin user with `role: "admin"`

```bash
# Run seed manually
npm run seed           # tsx src/seed.ts

# Run migrations + seed together
npm run setup          # npm run migrate && npm run seed
```

> In Docker, migrations and seed run automatically during container startup.

---

### API Endpoints

#### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and receive access + refresh tokens |
| POST | `/auth/logout` | Logout and invalidate refresh token |
| POST | `/auth/refresh` | Get a new access token using refresh token |

#### Users
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/users` | Create user | Public |
| GET | `/users` | Get all users | Admin only |
| GET | `/users/:id` | Get user by ID | Owner only |
| PATCH | `/users/:id` | Update user | Owner only |
| DELETE | `/users/:id` | Delete user | Owner only |

#### Posts
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/posts` | Create post | Login required |
| GET | `/posts` | Get all posts (paginated) | Login required |
| GET | `/posts/byUser/:userId` | Get posts by user (paginated) | Login required |
| PATCH | `/posts/:id` | Update post | Owner only |
| DELETE | `/posts/:id` | Delete post | Owner only |

---

### Frontend Pages

| Path | Page | Access |
|------|------|--------|
| `/login` | Login page | Public |
| `/register` | Registration page | Public |
| `/posts` | All posts (paginated) | Login required |
| `/profile` | User profile (view/edit/delete) | Login required |
| `/users` | User management | Admin only |

---

### Pagination

`GET /posts` and `GET /posts/byUser/:userId` support pagination:

```
GET /posts?page=1&limit=10
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `page` | `1` | Page number |
| `limit` | `10` | Items per page (max: 100) |

Response includes `meta`:
```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### Useful Commands

```bash
# Start (with rebuild)
docker compose up --build

# Start (without rebuild)
docker compose up

# Stop
docker compose down

# View backend logs
docker compose logs -f app

# View frontend logs
docker compose logs -f frontend

# Stop and remove volumes (deletes all data)
docker compose down -v
```

**Local development (without Docker):**
```bash
# Backend
cd backend
npm install
npm run dev          # Start dev server with hot reload

# Frontend (in another terminal)
cd frontend
npm install
npm run dev          # Start Vite dev server on port 5173
```

---
---

## Myanmar

---

### Tech Stack (MM)

**Backend**
- **Runtime**: Node.js 24
- **Framework**: Fastify 5
- **Language**: TypeScript
- **Database**: PostgreSQL 17
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Auth**: JWT (Access Token + Refresh Token)
- **Docs**: Swagger UI (`/docs`)

**Frontend**
- **Framework**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Routing**: React Router 7
- **HTTP Client**: Axios
- **Build Tool**: Vite 7

**Infrastructure**
- Docker + Docker Compose
- Nginx (production frontend)

---

### Project Structure (MM)

```
CRUD/
├── backend/
│   ├── src/
│   │   ├── middlewares/   # Auth middleware (JWT verify)
│   │   ├── routes/        # Auth, User, Post routes
│   │   ├── schemas/       # Drizzle table schemas
│   │   ├── db.ts          # Database connection
│   │   ├── migrate.ts     # Migration runner
│   │   ├── seed.ts        # Admin user seeder
│   │   └── index.ts       # Server entry point
│   ├── drizzle/           # Migration files
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/    # Navbar, ProtectedRoute, Pagination
│   │   ├── context/       # AuthContext (token management)
│   │   ├── pages/         # Login, Register, Posts, Users, Profile
│   │   ├── services/      # API service layer (auth, users, posts)
│   │   └── types/         # TypeScript interfaces
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

---

### Prerequisites (MM)

- [Docker](https://www.docker.com/) install လုပ်ထားဖို့ လိုတယ်
- ဒါပဲ — Node.js နဲ့ PostgreSQL ကို local မှာ install မလုပ်ရဘူး

---

### Getting Started (MM)

**1. Repository clone လုပ်ပါ**
```bash
git clone <your-github-repo-url>
cd CRUD
```

**2. `.env` file ဆောက်ပါ**
```bash
cp backend/.env.example backend/.env
```

`backend/.env` ထဲမှာ values တွေ ဖြည့်ပါ ([Environment Variables (MM)](#environment-variables-mm) ကြည့်ပါ)။

**3. Run လုပ်ပါ**
```bash
docker compose up --build
```

ဒါပဲ။ အောက်ပါတွေ အလိုအလျောက် ဖြစ်သွားမှာပါ:
- PostgreSQL database start တယ်
- Backend dependencies install + compile လုပ်တယ်
- Database migration တွေ run တယ်
- Admin user seed လုပ်တယ်
- Backend API port `3000` မှာ start တယ်
- Frontend ကို build ပြီး Nginx နဲ့ port `80` မှာ serve လုပ်တယ်

**4. App ကို ဝင်ကြည့်ပါ**

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/docs |

---

### Environment Variables (MM)

`backend/.env.example` ကနေ `backend/.env` ဆောက်ပါ:

```env
DATABASE_URL=postgres://myuser:mypassword@db:5432/mydb

ADMIN_EMAIL=admin@test.com
ADMIN_PASSWORD=AdmintestPassword123!

JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
```

| Variable | ဖော်ပြချက် |
|----------|------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ADMIN_EMAIL` | Seed လုပ်မယ့် admin email |
| `ADMIN_PASSWORD` | Seed လုပ်မယ့် admin password |
| `JWT_ACCESS_SECRET` | Access token sign လုပ်ဖို့ secret key |
| `JWT_REFRESH_SECRET` | Refresh token sign လုပ်ဖို့ secret key |
| `JWT_ACCESS_EXPIRES_IN` | Access token သက်တမ်း (default: `1d`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token သက်တမ်း (default: `7d`) |

---

### Authentication (MM)

ဒီ app မှာ **JWT token နှစ်မျိုး** သုံးထားတယ်:

| Token | ရည်ရွယ်ချက် | သက်တမ်း | သိမ်းတဲ့နေရာ |
|-------|-------------|---------|-------------|
| **Access Token** | API request တွေကို `Authorization: Bearer <token>` header နဲ့ authenticate လုပ်တယ် | တိုတိုတုတ် (default: 1 ရက်) | localStorage |
| **Refresh Token** | Access token သက်တမ်းကုန်ရင် token အသစ် ယူဖို့ သုံးတယ် | ရှည်ရှည် (default: 7 ရက်) | localStorage + database |

**အလုပ်လုပ်ပုံ:**

1. **Login** — User credentials ပို့တယ်။ Backend က access token နဲ့ refresh token နှစ်ခုလုံး ပြန်ပေးတယ်။ Refresh token ကို database ထဲမှာလည်း သိမ်းတယ်။
2. **API Requests** — Access token ကို request တိုင်းမှာ Axios interceptor က အလိုအလျောက် ထည့်ပေးတယ်။
3. **Token သက်တမ်းကုန်ရင်** — API request က `401` ပြန်လာရင်, frontend က refresh token နဲ့ `/auth/refresh` ကို အလိုအလျောက် ခေါ်ပြီး access token အသစ်ယူတယ်, ပြီးရင် fail ဖြစ်ခဲ့တဲ့ request ကို retry လုပ်တယ်။
4. **Logout** — Refresh token ကို backend ဆီ ပို့တယ်, backend က database ထဲက ဖျက်လိုက်တယ်, session ပိတ်သွားတယ်။

---

### Database Schema (MM)

App မှာ Drizzle ORM နဲ့ manage လုပ်တဲ့ table 3 ခု ရှိတယ်။ Schema တွေက `backend/src/schemas/` ထဲမှာ define လုပ်ထားတယ်။

#### `users` table
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | Primary key, auto-generated |
| `name` | `varchar(100)` | NOT NULL |
| `email` | `varchar(255)` | NOT NULL, UNIQUE |
| `password` | `varchar(255)` | NOT NULL (bcrypt hash) |
| `role` | `user_role` enum | `'admin'` သို့ `'user'`, default: `'user'` |
| `phone_no` | `varchar(20)` | Optional |
| `description` | `text` | Optional |
| `created_at` | `timestamp` | Default: `now()` |
| `updated_at` | `timestamp` | Default: `now()` |

#### `posts` table
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | Primary key, auto-generated |
| `user_id` | `uuid` | FK → `users.id`, ON DELETE SET NULL |
| `title` | `varchar(255)` | NOT NULL |
| `content` | `text` | NOT NULL |
| `created_at` | `timestamp` | Default: `now()` |
| `updated_at` | `timestamp` | Default: `now()` |

#### `refresh_tokens` table
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | Primary key, auto-generated |
| `user_id` | `uuid` | FK → `users.id`, ON DELETE CASCADE |
| `token` | `text` | NOT NULL, UNIQUE |
| `expires_at` | `timestamptz` | NOT NULL |
| `is_revoked` | `boolean` | Default: `false` |
| `created_at` | `timestamptz` | Default: `now()` |

**Relationships:**
- `posts.user_id` → `users.id` (SET NULL — user ဖျက်လိုက်ရင် post တွေ ကျန်နေမယ်)
- `refresh_tokens.user_id` → `users.id` (CASCADE — user ဖျက်လိုက်ရင် token တွေ ပါဖျက်မယ်)

---

### Database Optimization (MM)

မကြာခဏ query လုပ်ရတဲ့ column တွေမှာ B-tree index တွေ ထည့်ထားတယ်:

| Index | Table | Column | ရည်ရွယ်ချက် |
|-------|-------|--------|-------------|
| `idx_users_created_at` | `users` | `created_at` | User တွေကို ရက်စွဲအလိုက် sort လုပ်ဖို့ |
| `users_email_unique` | `users` | `email` | Unique constraint (auto-indexed) + login lookup |
| `idx_posts_user_id` | `posts` | `user_id` | User ရဲ့ post တွေ filter လုပ်ဖို့ (`GET /posts/byUser/:userId`) |
| `idx_posts_created_at` | `posts` | `created_at` | Post တွေကို အသစ်ဆုံးအရင် sort လုပ်ဖို့ (`ORDER BY created_at DESC`) |
| `token_idx` | `refresh_tokens` | `token` | Refresh/logout လုပ်တဲ့အခါ token ကို မြန်မြန် ရှာဖို့ |
| `refresh_tokens_token_unique` | `refresh_tokens` | `token` | Unique constraint (auto-indexed) |

Index တွေကို Drizzle schema file ထဲမှာ ဒီလို define လုပ်ထားတယ်:

```typescript
// backend/src/schemas/post_schema.ts
export const posts = pgTable("posts", {
  // ...columns
}, (table) => ({
  userIdIdx:    index("idx_posts_user_id").on(table.userId),
  createdAtIdx: index("idx_posts_created_at").on(table.createdAt),
}));
```

**Connection pool settings** (`backend/src/db.ts`):

| Setting | Value | ဖော်ပြချက် |
|---------|-------|------------|
| `connectionTimeoutMillis` | `3000` | DB မရှိရင် 3 စက္ကန့်မှာ fail ဖြစ်မယ် |
| `idleTimeoutMillis` | `10000` | Idle connection ကို 10 စက္ကန့်ပြီးရင် ပိတ်မယ် |

---

### Migration (MM)

Migration တွေကို Drizzle Kit နဲ့ handle လုပ်တယ်။ SQL migration file တွေက schema ပြောင်းလဲမှုအရ auto-generate ဖြစ်ပြီး `backend/drizzle/` ထဲမှာ သိမ်းထားတယ်။

**အလုပ်လုပ်ပုံ:**

1. Drizzle Kit က schema files (`backend/src/schemas/*.ts`) ကို ယခင် snapshot နဲ့ နှိုင်းယှဉ်တယ်
2. SQL migration file (ဥပမာ `0000_silly_photon.sql`) နဲ့ snapshot ကို `drizzle/meta/` ထဲမှာ generate လုပ်တယ်
3. Server start တဲ့အခါ `backend/src/migrate.ts` က pending migration တွေ run တယ်

**Retry logic** — Migration runner က database ကို run မလုပ်ခင် ready ဖြစ်အောင် 3 စက္ကန့်ခြား 10 ကြိမ်ထိ retry လုပ်တယ်။ Docker မှာ PostgreSQL က app ထက် နောက်ကျ start နိုင်တာကြောင့်:

```typescript
// backend/src/migrate.ts
async function waitForDb(pool: Pool, retries = 10, delay = 3000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      client.release();
      return;
    } catch {
      console.log(`⏳ Waiting for database... (${i + 1}/${retries})`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error("❌ Database not ready after retries");
}
```

**Commands:**
```bash
# Schema ပြောင်းပြီးရင် migration အသစ် generate လုပ်ပါ
npx drizzle-kit generate

# Pending migration တွေ run ပါ
npm run migrate        # tsx src/migrate.ts

# Migration + seed တစ်ခါတည်း run ပါ
npm run setup          # npm run migrate && npm run seed
```

**Config** (`backend/drizzle.config.ts`):
```typescript
export default defineConfig({
  schema:  "./src/schemas",
  out:     "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

---

### Seed (MM)

Seed script (`backend/src/seed.ts`) က `.env` ထဲက `ADMIN_EMAIL` နဲ့ `ADMIN_PASSWORD` ကို သုံးပြီး admin user တစ်ယောက် ဆောက်ပေးတယ်။

**လုပ်ဆောင်ပုံ:**
1. `ADMIN_EMAIL` နဲ့ `ADMIN_PASSWORD` ရှိမရှိ စစ်တယ် — မရှိရင် error ပြပြီး ထွက်တယ်
2. အဲ့ email နဲ့ user ရှိပြီးသားလား စစ်တယ် — ရှိရင် skip လုပ်တယ်
3. Password ကို bcrypt နဲ့ hash လုပ်တယ် (salt rounds: 10)
4. `role: "admin"` နဲ့ user insert လုပ်တယ်

```bash
# Seed ကို manual run ပါ
npm run seed           # tsx src/seed.ts

# Migration + seed တစ်ခါတည်း run ပါ
npm run setup          # npm run migrate && npm run seed
```

> Docker မှာ container start တဲ့အခါ migration နဲ့ seed အလိုအလျောက် run တယ်။

---

### API Endpoints (MM)

#### Auth
| Method | Endpoint | ဖော်ပြချက် |
|--------|----------|------------|
| POST | `/auth/register` | User အသစ် register လုပ်တယ် |
| POST | `/auth/login` | Login လုပ်ပြီး access token + refresh token ရတယ် |
| POST | `/auth/logout` | Logout လုပ်ပြီး refresh token ပယ်ဖျက်တယ် |
| POST | `/auth/refresh` | Refresh token နဲ့ access token အသစ် ယူတယ် |

#### Users
| Method | Endpoint | ဖော်ပြချက် | အသုံးပြုခွင့် |
|--------|----------|------------|---------------|
| POST | `/users` | User ဆောက်တယ် | Public |
| GET | `/users` | User အားလုံး ကြည့်တယ် | Admin သာ |
| GET | `/users/:id` | User တစ်ယောက် ကြည့်တယ် | ပိုင်ရှင်သာ |
| PATCH | `/users/:id` | User ပြင်တယ် | ပိုင်ရှင်သာ |
| DELETE | `/users/:id` | User ဖျက်တယ် | ပိုင်ရှင်သာ |

#### Posts
| Method | Endpoint | ဖော်ပြချက် | အသုံးပြုခွင့် |
|--------|----------|------------|---------------|
| POST | `/posts` | Post ဆောက်တယ် | Login လုပ်ထားရမယ် |
| GET | `/posts` | Post အားလုံး ကြည့်တယ် (paginated) | Login လုပ်ထားရမယ် |
| GET | `/posts/byUser/:userId` | User တစ်ယောက်ရဲ့ posts ကြည့်တယ် (paginated) | Login လုပ်ထားရမယ် |
| PATCH | `/posts/:id` | Post ပြင်တယ် | ပိုင်ရှင်သာ |
| DELETE | `/posts/:id` | Post ဖျက်တယ် | ပိုင်ရှင်သာ |

---

### Frontend Pages (MM)

| Path | Page | အသုံးပြုခွင့် |
|------|------|---------------|
| `/login` | Login page | Public |
| `/register` | Registration page | Public |
| `/posts` | Post အားလုံး (paginated) | Login လုပ်ထားရမယ် |
| `/profile` | User profile (ကြည့်/ပြင်/ဖျက်) | Login လုပ်ထားရမယ် |
| `/users` | User management | Admin သာ |

---

### Pagination (MM)

`GET /posts` နဲ့ `GET /posts/byUser/:userId` မှာ pagination သုံးလို့ရတယ်:

```
GET /posts?page=1&limit=10
```

| Parameter | Default | ဖော်ပြချက် |
|-----------|---------|------------|
| `page` | `1` | Page နံပါတ် |
| `limit` | `10` | တစ်ခါပြမယ့် item အရေအတွက် (အများဆုံး: 100) |

Response မှာ `meta` ပါလာမယ်:
```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### Useful Commands (MM)

```bash
# Start (rebuild နဲ့)
docker compose up --build

# Start (rebuild မပါ)
docker compose up

# Stop
docker compose down

# Backend log ကြည့်တယ်
docker compose logs -f app

# Frontend log ကြည့်တယ်
docker compose logs -f frontend

# Stop ပြီး volume ဖျက်တယ် (data အကုန် ပျောက်မယ်)
docker compose down -v
```

**Local development (Docker မသုံးပဲ):**
```bash
# Backend
cd backend
npm install
npm run dev          # Hot reload နဲ့ dev server start တယ်

# Frontend (terminal တစ်ခုခြားမှာ)
cd frontend
npm install
npm run dev          # Vite dev server port 5173 မှာ start တယ်
```
