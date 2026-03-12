# CRUD API

> Fastify + TypeScript + PostgreSQL + Drizzle ORM + JWT + Swagger

---

## 🇬🇧 English

### Tech Stack

- **Runtime**: Node.js 24
- **Framework**: Fastify 5
- **Language**: TypeScript
- **Database**: PostgreSQL 17
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Auth**: JWT
- **Docs**: Swagger UI (`/docs`)
- **Container**: Docker + Docker Compose

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
cp .env.example .env
```

Edit `.env` with your values:
```env
DATABASE_URL=postgres://myuser:mypassword@db:5432/mydb
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@test.com
ADMIN_PASSWORD=AdmintestPassword123!
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=mydb
```

**3. Run**
```bash
docker compose up --build
```

That's all. The following will happen automatically:
- PostgreSQL database starts
- Dependencies are installed
- TypeScript is compiled
- Database migrations run
- Admin user is seeded
- Server starts on port `3000`

---

### API Documentation

Once running, visit:
```
http://localhost:3000/docs
```

---

### API Endpoints

#### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and receive JWT token |
| POST | `/auth/logout` | Logout (stateless) |

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
  "data": [...],
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

# View logs
docker compose logs -f app

# Stop and remove volumes (deletes all data)
docker compose down -v
```

---

---

## 🇲🇲 မြန်မာဘာသာ

### Tech Stack

- **Runtime**: Node.js 24
- **Framework**: Fastify 5
- **Language**: TypeScript
- **Database**: PostgreSQL 17
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Auth**: JWT
- **Docs**: Swagger UI (`/docs`)
- **Container**: Docker + Docker Compose

---

### လိုအပ်တာ

- [Docker](https://www.docker.com/) install လုပ်ထားဖို့ လိုတယ်
- ဒါပဲ — Node.js နဲ့ PostgreSQL ကို local မှာ install မလုပ်ရဘူး

---

### စတင်အသုံးပြုနည်း

**1. Repository clone လုပ်ပါ**
```bash
git clone <your-github-repo-url>
cd CRUD
```

**2. `.env` file ဆောက်ပါ**
```bash
cp .env.example .env
```

`.env` ထဲမှာ values တွေ ဖြည့်ပါ:
```env
DATABASE_URL=postgres://myuser:mypassword@db:5432/mydb
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admintest@testexample.com
ADMIN_PASSWORD=testPassword123!
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=mydb
```

**3. Run လုပ်ပါ**
```bash
docker compose up --build
```

ဒါပဲ။ အောက်ပါတွေ အလိုအလျောက် ဖြစ်သွားမှာပါ:
- PostgreSQL database start တယ်
- Dependencies တွေ install လုပ်တယ်
- TypeScript compile လုပ်တယ်
- Database migration တွေ run တယ်
- Admin user seed လုပ်တယ်
- Port `3000` မှာ server start တယ်

---

### API Documentation

Run ပြီးရင် ဒီ URL မှာ Swagger UI ကြည့်နိုင်တယ်:
```
http://localhost:3000/docs
```

---

### API Endpoints

#### Auth
| Method | Endpoint | ဖော်ပြချက် |
|--------|----------|------------|
| POST | `/auth/register` | User အသစ် register လုပ်တယ် |
| POST | `/auth/login` | Login လုပ်ပြီး JWT token ရတယ် |
| POST | `/auth/logout` | Logout လုပ်တယ် (stateless) |

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

### Pagination

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
  "data": [...],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### အသုံးဝင်တဲ့ Commands

```bash
# Start (rebuild နဲ့)
docker compose up --build

# Start (rebuild မပါ)
docker compose up

# Stop
docker compose down

# Log ကြည့်တယ်
docker compose logs -f app

# Stop ပြီး volume ဖျက်တယ် (data အကုန် ပျောက်မယ်)
docker compose down -v
```
